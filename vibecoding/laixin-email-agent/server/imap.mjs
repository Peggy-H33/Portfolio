import {ImapFlow} from 'imapflow';
import {simpleParser} from 'mailparser';
import {stableId} from './domain.mjs';

const hosts={'163.com':'imap.163.com','126.com':'imap.126.com','yeah.net':'imap.yeah.net'};
export function validateCredentials(email,authCode) {
  if(typeof email!=='string'||typeof authCode!=='string') throw new Error('请填写邮箱和客户端授权码');
  email=email.trim().toLowerCase(); const domain=email.split('@')[1];
  if(!/^[^\s@]+@[^\s@]+$/.test(email)||!hosts[domain]) throw new Error('当前支持 @163.com、@126.com、@yeah.net 个人邮箱');
  if(!authCode.trim()||authCode.length>256) throw new Error('请输入邮箱设置中生成的客户端授权码');
  return {email,authCode:authCode.trim(),host:hosts[domain]};
}
export function publicImapError(error) {
  if(error?.authenticationFailed || /AUTH|LOGIN|Unsafe Login|authorization/i.test(String(error?.code)+' '+String(error?.responseStatus)+' '+String(error?.message))) return '网易拒绝登录。请确认已启用 IMAP，填写的是客户端授权码，并完成网易要求的安全验证。';
  if(error?.code==='STALE_UID') return '邮件身份已变化，请先重新同步再操作。';
  if(error?.code==='BODY_TOO_LARGE') return '正文超过 256 KB 限制，请在网易邮箱查看原文。';
  if(error?.code==='NO_SENT') return '没有识别到已发送文件夹，请先在网易邮箱确认文件夹名称。';
  return '邮箱连接或读取失败，请检查网络及 IMAP 设置后重试。原有结果已保留。';
}
export async function withImap(credentials,operation,{retry=true}={}) {
  let last;
  for(let attempt=0;attempt<(retry?2:1);attempt++) {
    const client=new ImapFlow({host:credentials.host,port:993,secure:true,auth:{user:credentials.email,pass:credentials.authCode},clientInfo:{name:'LaixinEmailAgent',version:'1.0.0',vendor:'Personal local agent'},logger:false,disableAutoIdle:true,connectionTimeout:12000,greetingTimeout:12000,socketTimeout:20000,tls:{rejectUnauthorized:true}});
    client.on('error',()=>{});
    try {await client.connect();return await operation(client);} catch(error) {last=error; if(error?.authenticationFailed||!['ECONNRESET','ETIMEDOUT','ETIMEOUT','EAI_AGAIN','ENOTFOUND','NoConnection','ConnectionClosed'].includes(error?.code)) break;}
    finally {try{client.close();}catch{}}
    if(attempt===0&&retry) await new Promise(resolve=>setTimeout(resolve,800));
  }
  throw last;
}
const errorWith=(message,code)=>Object.assign(new Error(message),{code});
export async function readMailbox(credentials,{sent=false}={}) {
  return withImap(credentials,async client=>{
    let path='INBOX';
    if(sent) {const folders=await client.list(); path=folders.find(f=>f.specialUse==='\\Sent')?.path || folders.find(f=>/^(Sent|Sent Messages|Sent Items|已发送|已发送邮件)$/i.test(f.name))?.path; if(!path) throw errorWith('Sent folder not found','NO_SENT');}
    const lock=await client.getMailboxLock(path,{readOnly:true});
    try {
      const validity=String(client.mailbox.uidValidity), since=new Date(Date.now()-30*86400000);
      const all=await client.search({since},{uid:true})||[], uids=all.sort((a,b)=>a-b).slice(-300);
      const records=uids.length?await client.fetchAll(uids,{uid:true,envelope:true,flags:true,internalDate:true,headers:['References','In-Reply-To','Message-ID']},{uid:true}):[];
      const messages=[];
      for(const record of records) {
        const env=record.envelope||{}, from=env.from?.[0]||{};
        const headers=record.headers?await simpleParser(Buffer.concat([record.headers,Buffer.from('\r\n')]),{skipHtmlToText:true,skipTextToHtml:true}):{};
        const references=Array.isArray(headers.references)?headers.references:typeof headers.references==='string'?[headers.references]:[];
        messages.push({id:stableId(credentials.email,path,validity,record.uid),sender:from.name||from.address||'未知发件人',address:from.address||'',subject:env.subject||'(无主题)',preview:'正文按需读取；同步不会自动标为已读。',receivedAt:new Date(record.internalDate||env.date||Date.now()).toISOString(),flagged:record.flags?.has('\\Flagged')||false,unread:!record.flags?.has('\\Seen'),matchReasons:[],to:(env.to||[]).map(a=>a.address).filter(Boolean).join(', '),messageId:env.messageId||headers.messageId||'',inReplyTo:env.inReplyTo||headers.inReplyTo||'',references,_uid:record.uid,_validity:validity,_mailbox:path});
      }
      return {messages:messages.sort((a,b)=>b.receivedAt.localeCompare(a.receivedAt)),partial:all.length>300,scope:`${sent?'已发送文件夹':'收件箱'}最近 30 天，最多 300 封；本次找到 ${all.length} 封，读取 ${messages.length} 封；不含附件`};
    } finally{lock.release();}
  });
}
async function checkIdentity(client,mail) {if(String(client.mailbox.uidValidity)!==mail._validity) throw errorWith('Mailbox identity changed','STALE_UID'); const current=await client.fetchOne(String(mail._uid),{uid:true,flags:true},{uid:true}); if(!current||current.uid!==mail._uid) throw errorWith('Message no longer exists','STALE_UID'); return current;}
export async function flagMessage(credentials,mail,flagged) {
  return withImap(credentials,async client=>{const lock=await client.getMailboxLock(mail._mailbox,{readOnly:false}); try {const current=await checkIdentity(client,mail); if(current.flags.has('\\Flagged')!==flagged) {const done=flagged?await client.messageFlagsAdd([mail._uid],['\\Flagged'],{uid:true}):await client.messageFlagsRemove([mail._uid],['\\Flagged'],{uid:true}); if(!done) throw new Error('Flag write failed');} const verify=await client.fetchOne(String(mail._uid),{uid:true,flags:true},{uid:true}); if(!verify||verify.flags.has('\\Flagged')!==flagged) throw new Error('Flag verification failed'); return flagged;}finally{lock.release();}},{retry:false});
}
function textPart(node) {if(!node || node.disposition==='attachment') return null; if(node.type==='text/plain')return node; for(const child of node.childNodes||[]){const p=textPart(child);if(p?.type==='text/plain')return p;} if(node.type==='text/html')return node; for(const child of node.childNodes||[]){const p=textPart(child);if(p)return p;}return null;}
export async function readBody(credentials,mail) {
  return withImap(credentials,async client=>{const lock=await client.getMailboxLock(mail._mailbox,{readOnly:true});try{
    await checkIdentity(client,mail); const record=await client.fetchOne(String(mail._uid),{bodyStructure:true},{uid:true}); const part=textPart(record.bodyStructure);
    if(!part)return '未发现可读取的文本正文；附件未读取。';
    if((part.size||0)>256*1024)throw errorWith('Body too large','BODY_TOO_LARGE');
    const result=await client.download(String(mail._uid),part.part||'1',{uid:true,maxBytes:256*1024+1}); let length=0;const chunks=[];
    for await(const chunk of result.content){length+=chunk.length;if(length>256*1024){result.content.destroy();throw errorWith('Body too large','BODY_TOO_LARGE');}chunks.push(chunk);}
    // download decodes transfer encoding. mailparser handles charset and HTML-to-text; attachments are never requested.
    const charset=String(result.meta.charset||part.parameters?.charset||'utf-8').replace(/[\r\n";]/g,'');
    const parsed=await simpleParser(Buffer.concat([Buffer.from(`Content-Type: ${part.type}; charset="${charset}"\r\nContent-Transfer-Encoding: 8bit\r\n\r\n`),...chunks]),{skipTextToHtml:true});
    return (parsed.text||'正文为空。').slice(0,100000);
  }finally{lock.release();}});
}
