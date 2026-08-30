(function () {
  "use strict";

  var VERSION = "1.1.0";
  var host = document.getElementById("eh-editor-host");
  var template = document.getElementById("eh-editor-template");
  var root = document.querySelector("[data-editable-html-root]");

  if (!host || !template || !root || host.shadowRoot) {
    if (!root) console.error("Editable HTML: missing data-editable-html-root.");
    return;
  }

  var shadow = host.attachShadow({ mode: "open" });
  shadow.appendChild(template.content.cloneNode(true));

  function find(selector) {
    return shadow.querySelector(selector);
  }

  var toolbar = find("#eh-toolbar");
  var status = find("#eh-status");
  var readButton = find("#eh-read-mode");
  var editButton = find("#eh-edit-mode");
  var painterButton = find("#eh-painter");
  var fileInput = find("#eh-image-file");
  var imagebar = find("#eh-imagebar");
  var mode = "read";
  var savedRange = null;
  var insertRange = null;
  var painter = null;
  var selectedImage = null;
  var statusTimer = 0;
  var nestedEditableRecords = [];

  function lockNestedEditables() {
    nestedEditableRecords = [];
    root.querySelectorAll("[contenteditable]").forEach(function (element) {
      if (element === host) return;
      nestedEditableRecords.push({
        element: element,
        value: element.getAttribute("contenteditable")
      });
      element.setAttribute("contenteditable", "false");
    });
  }

  function restoreNestedEditables() {
    nestedEditableRecords.forEach(function (record) {
      if (!record.element.isConnected) return;
      if (record.value == null) record.element.removeAttribute("contenteditable");
      else record.element.setAttribute("contenteditable", record.value);
    });
    nestedEditableRecords = [];
  }

  function say(message, persistent) {
    status.textContent = message;
    window.clearTimeout(statusTimer);
    if (!persistent) {
      statusTimer = window.setTimeout(function () {
        if (mode === "edit" && !painter) {
          status.textContent = "编辑模式：可直接修改文字；点击图片可缩放或删除。";
        }
      }, 2600);
    }
  }

  function nodeElement(node) {
    if (!node) return null;
    return node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  }

  function isInsideRoot(node) {
    if (!node || !root.contains(node)) return false;
    var element = nodeElement(node);
    return !element || (element !== host && !host.contains(element));
  }

  function rangeInsideRoot(range) {
    return Boolean(
      range && isInsideRoot(range.startContainer) && isInsideRoot(range.endContainer)
    );
  }

  function rememberSelection() {
    var selection = window.getSelection();
    if (!selection || !selection.rangeCount) return false;
    var range = selection.getRangeAt(0);
    if (!rangeInsideRoot(range)) return false;
    savedRange = range.cloneRange();
    return true;
  }

  function restoreSelection(range) {
    var target = range || savedRange;
    if (!rangeInsideRoot(target)) return false;
    try {
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(target.cloneRange());
      return true;
    } catch (error) {
      savedRange = null;
      return false;
    }
  }

  function clearDocumentSelection() {
    var selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    if (rangeInsideRoot(selection.getRangeAt(0))) selection.removeAllRanges();
  }

  function clearImageSelection() {
    if (selectedImage) selectedImage.classList.remove("eh-image-selected");
    selectedImage = null;
    imagebar.hidden = true;
  }

  function cancelPainter(silent) {
    painter = null;
    painterButton.classList.remove("eh-active");
    painterButton.setAttribute("aria-pressed", "false");
    document.documentElement.classList.remove("eh-format-painting");
    if (!silent && mode === "edit") say("已取消格式刷。");
  }

  function setMode(nextMode, initial) {
    var editing = nextMode === "edit";
    mode = editing ? "edit" : "read";
    document.documentElement.classList.toggle("eh-mode-edit", editing);
    document.documentElement.classList.toggle("eh-mode-read", !editing);
    root.setAttribute("contenteditable", editing ? "true" : "false");
    root.setAttribute("spellcheck", "false");
    toolbar.hidden = !editing;
    readButton.setAttribute("aria-pressed", String(!editing));
    editButton.setAttribute("aria-pressed", String(editing));

    if (editing) {
      restoreNestedEditables();
      if (!initial) {
        try {
          root.focus({ preventScroll: true });
        } catch (error) {
          root.focus();
        }
        say("编辑模式已开启。点击文字即可修改，点击图片可调整。", true);
      }
    } else {
      lockNestedEditables();
      clearImageSelection();
      cancelPainter(true);
      savedRange = null;
      insertRange = null;
      clearDocumentSelection();
      root.blur();
    }
  }

  readButton.addEventListener("click", function () { setMode("read"); });
  editButton.addEventListener("click", function () { setMode("edit"); });

  document.addEventListener("selectionchange", function () {
    if (mode === "edit") rememberSelection();
  });

  function prepareCommand(event) {
    event.preventDefault();
  }

  shadow.querySelectorAll("[data-command], #eh-painter, #eh-insert-image").forEach(function (control) {
    control.addEventListener("mousedown", prepareCommand);
  });

  function runCommand(command, value) {
    if (mode !== "edit") setMode("edit");
    if (!restoreSelection()) root.focus();
    try {
      document.execCommand(command, false, value == null ? null : value);
    } catch (error) {
      say("当前浏览器未能执行此格式命令。");
    }
    rememberSelection();
  }

  shadow.querySelectorAll("[data-command]").forEach(function (button) {
    button.addEventListener("click", function () {
      runCommand(button.getAttribute("data-command"));
    });
  });

  find("#eh-block").addEventListener("change", function (event) {
    runCommand("formatBlock", event.target.value);
  });

  find("#eh-size").addEventListener("change", function (event) {
    var size = event.target.value;
    if (!size) return;
    var preserved = Array.from(root.querySelectorAll('font[size="7"]'));
    preserved.forEach(function (font) { font.removeAttribute("size"); });
    try {
      if (mode !== "edit") setMode("edit");
      if (!restoreSelection()) root.focus();
      document.execCommand("styleWithCSS", false, false);
      document.execCommand("fontSize", false, "7");
      root.querySelectorAll('font[size="7"]').forEach(function (font) {
        var span = document.createElement("span");
        span.style.fontSize = size;
        while (font.firstChild) span.appendChild(font.firstChild);
        font.replaceWith(span);
      });
    } catch (error) {
      say("当前浏览器未能应用这个字号。");
    } finally {
      try { document.execCommand("styleWithCSS", false, true); } catch (error) {}
      preserved.forEach(function (font) {
        if (font.isConnected) font.setAttribute("size", "7");
      });
    }
    event.target.value = "";
    rememberSelection();
  });

  function applyColor(input, swatch, command) {
    var value = input.value;
    swatch.parentElement.style.setProperty("--eh-color-value", value);
    runCommand(command, value);
  }

  find("#eh-fore-color").addEventListener("input", function (event) {
    applyColor(event.target, find("#eh-fore-swatch"), "foreColor");
  });

  find("#eh-back-color").addEventListener("input", function (event) {
    if (!restoreSelection()) root.focus();
    try {
      var applied = document.execCommand("hiliteColor", false, event.target.value);
      if (applied === false) document.execCommand("backColor", false, event.target.value);
    } catch (error) {
      document.execCommand("backColor", false, event.target.value);
    }
    find("#eh-back-swatch").parentElement.style.setProperty(
      "--eh-color-value",
      event.target.value
    );
    rememberSelection();
  });

  function captureFormat() {
    var range = savedRange;
    if (!rangeInsideRoot(range) || range.collapsed) return null;
    var element = nodeElement(range.startContainer);
    if (!element) return null;
    var computed = getComputedStyle(element);
    var background = "transparent";
    var current = element;
    while (current && current !== root) {
      var candidate = getComputedStyle(current).backgroundColor;
      if (
        candidate &&
        candidate !== "transparent" &&
        candidate !== "rgba(0, 0, 0, 0)"
      ) {
        background = candidate;
        break;
      }
      current = current.parentElement;
    }
    return {
      fontWeight: computed.fontWeight,
      fontStyle: computed.fontStyle,
      textDecoration: computed.textDecorationLine,
      color: computed.color,
      backgroundColor: background,
      fontSize: computed.fontSize,
      fontFamily: computed.fontFamily
    };
  }

  function unwrap(element) {
    var fragment = document.createDocumentFragment();
    while (element.firstChild) fragment.appendChild(element.firstChild);
    element.replaceWith(fragment);
  }

  function applyPainter() {
    var selection = window.getSelection();
    if (!selection || !selection.rangeCount || selection.isCollapsed) return false;
    var range = selection.getRangeAt(0);
    if (!rangeInsideRoot(range)) return false;

    var container = document.createElement("div");
    container.appendChild(range.cloneContents());
    container.querySelectorAll("[style]").forEach(function (node) {
      node.removeAttribute("style");
    });
    container.querySelectorAll("b,strong,i,em,u,s,strike,font,span,mark").forEach(unwrap);

    var wrapper = document.createElement("span");
    wrapper.style.fontWeight = painter.fontWeight;
    wrapper.style.fontStyle = painter.fontStyle;
    wrapper.style.color = painter.color;
    wrapper.style.fontSize = painter.fontSize;
    wrapper.style.fontFamily = painter.fontFamily;
    if (painter.textDecoration && painter.textDecoration !== "none") {
      wrapper.style.textDecoration = painter.textDecoration;
    }
    if (painter.backgroundColor && painter.backgroundColor !== "transparent") {
      wrapper.style.backgroundColor = painter.backgroundColor;
      wrapper.style.borderRadius = "3px";
    }
    while (container.firstChild) wrapper.appendChild(container.firstChild);

    range.deleteContents();
    range.insertNode(wrapper);
    selection.removeAllRanges();
    var appliedRange = document.createRange();
    appliedRange.selectNodeContents(wrapper);
    selection.addRange(appliedRange);
    savedRange = appliedRange.cloneRange();
    return true;
  }

  painterButton.setAttribute("aria-pressed", "false");
  painterButton.addEventListener("click", function () {
    if (painter) {
      cancelPainter();
      return;
    }
    painter = captureFormat();
    if (!painter) {
      window.alert("请先选中一段作为样板的文字，再点击格式刷。");
      return;
    }
    painterButton.classList.add("eh-active");
    painterButton.setAttribute("aria-pressed", "true");
    document.documentElement.classList.add("eh-format-painting");
    say("格式已拾取，请拖动选中目标文字。按 Esc 可取消。", true);
  });

  root.addEventListener("mouseup", function () {
    if (!painter || mode !== "edit") return;
    window.setTimeout(function () {
      if (applyPainter()) {
        cancelPainter(true);
        say("格式已应用。");
      }
    }, 0);
  });

  function readAsDataURL(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(reader.error || new Error("图片读取失败")); };
      reader.readAsDataURL(file);
    });
  }

  function insertFigure(dataURL, fileName) {
    var figure = document.createElement("figure");
    figure.setAttribute("data-editable-html-inserted-image", "");
    figure.style.maxWidth = "320px";
    figure.style.margin = "16px auto";
    figure.style.textAlign = "center";

    var image = document.createElement("img");
    image.src = dataURL;
    image.alt = fileName ? fileName.replace(/\.[^.]+$/, "") : "插入的图片";
    image.style.display = "block";
    image.style.width = "100%";
    image.style.maxWidth = "100%";
    image.style.height = "auto";

    var caption = document.createElement("figcaption");
    caption.textContent = "✏️ 点击这里编辑图片说明";
    caption.style.marginTop = "7px";
    caption.style.fontSize = "0.84em";
    caption.style.opacity = "0.72";

    figure.appendChild(image);
    figure.appendChild(caption);

    var targetRange = rangeInsideRoot(insertRange) ? insertRange.cloneRange() : null;
    if (targetRange) {
      try {
        targetRange.collapse(false);
        targetRange.insertNode(figure);
      } catch (error) {
        root.appendChild(figure);
      }
    } else {
      root.appendChild(figure);
    }

    var nextRange = document.createRange();
    nextRange.setStartAfter(figure);
    nextRange.collapse(true);
    insertRange = nextRange;
    savedRange = nextRange.cloneRange();
    figure.scrollIntoView({ behavior: "smooth", block: "center" });
    selectImage(image);
  }

  find("#eh-insert-image").addEventListener("click", function () {
    insertRange = rangeInsideRoot(savedRange) ? savedRange.cloneRange() : null;
    fileInput.click();
  });

  fileInput.addEventListener("change", async function () {
    var files = Array.from(fileInput.files || []);
    for (var index = 0; index < files.length; index += 1) {
      try {
        var dataURL = await readAsDataURL(files[index]);
        insertFigure(dataURL, files[index].name);
      } catch (error) {
        say("有一张图片读取失败，请重试。");
      }
    }
    fileInput.value = "";
    if (files.length) say("图片已嵌入当前 HTML。");
  });

  function imageBox() {
    if (!selectedImage) return null;
    return selectedImage.closest("figure") || selectedImage;
  }

  function positionImagebar() {
    if (!selectedImage || mode !== "edit") return;
    var rect = selectedImage.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      clearImageSelection();
      return;
    }
    imagebar.hidden = false;
    var barRect = imagebar.getBoundingClientRect();
    var left = rect.left + rect.width / 2 - barRect.width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - barRect.width - 8));
    var top = rect.top - barRect.height - 8;
    if (top < 8) top = Math.min(window.innerHeight - barRect.height - 8, rect.bottom + 8);
    imagebar.style.left = Math.round(left) + "px";
    imagebar.style.top = Math.round(top) + "px";
  }

  function selectImage(image) {
    clearImageSelection();
    selectedImage = image;
    selectedImage.classList.add("eh-image-selected");
    imagebar.hidden = false;
    window.requestAnimationFrame(positionImagebar);
  }

  function resizeImage(factor) {
    var box = imageBox();
    if (!box) return;
    var width = box.getBoundingClientRect().width;
    box.style.maxWidth = "none";
    box.style.width = Math.max(60, Math.round(width * factor)) + "px";
    window.requestAnimationFrame(positionImagebar);
  }

  function deleteSelectedImage() {
    var box = imageBox();
    if (!box) return;
    clearImageSelection();
    box.remove();
    say("图片已删除。", true);
  }

  find("#eh-image-smaller").addEventListener("click", function () { resizeImage(0.85); });
  find("#eh-image-bigger").addEventListener("click", function () { resizeImage(1.15); });
  find("#eh-image-delete").addEventListener("click", deleteSelectedImage);

  root.addEventListener("click", function (event) {
    if (mode !== "edit") return;
    var target = event.target;
    if (target instanceof HTMLImageElement) {
      event.preventDefault();
      selectImage(target);
      return;
    }
    clearImageSelection();
    var element = nodeElement(target);
    var link = element && element.closest ? element.closest("a") : null;
    if (link && root.contains(link)) {
      event.preventDefault();
      say("编辑模式下已阻止链接跳转；切到阅读模式即可打开链接。");
    }
  });

  window.addEventListener("scroll", positionImagebar, true);
  window.addEventListener("resize", positionImagebar);

  document.addEventListener("keydown", function (event) {
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "e") {
      event.preventDefault();
      setMode(mode === "edit" ? "read" : "edit");
      return;
    }
    if (event.key === "Escape") {
      clearImageSelection();
      if (painter) cancelPainter();
      return;
    }
    if (
      mode === "edit" &&
      selectedImage &&
      (event.key === "Delete" || event.key === "Backspace")
    ) {
      event.preventDefault();
      deleteSelectedImage();
    }
  });

  function serializedDoctype() {
    var doctype = document.doctype;
    if (!doctype) return "<!DOCTYPE html>";
    var value = "<!DOCTYPE " + doctype.name;
    if (doctype.publicId) value += ' PUBLIC "' + doctype.publicId + '"';
    if (doctype.systemId) value += ' "' + doctype.systemId + '"';
    return value + ">";
  }

  function downloadName() {
    var requested = root.getAttribute("data-editable-html-filename");
    var base = requested || document.title || "可编辑页面";
    base = base.replace(/\.html?$/i, "").replace(/[\\/:*?"<>|]+/g, "-").trim();
    return (base || "可编辑页面") + "-已编辑.html";
  }

  function saveHTML() {
    clearImageSelection();
    var clone = document.documentElement.cloneNode(true);
    clone.classList.remove("eh-mode-edit", "eh-mode-read", "eh-format-painting");
    var cloneRoot = clone.querySelector("[data-editable-html-root]");
    if (cloneRoot) {
      cloneRoot.setAttribute("contenteditable", "false");
      cloneRoot.setAttribute("spellcheck", "false");
    }
    clone.querySelectorAll(".eh-image-selected").forEach(function (image) {
      image.classList.remove("eh-image-selected");
    });

    var html = serializedDoctype() + "\n" + clone.outerHTML;
    var blob = new Blob([html], { type: "text/html;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = downloadName();
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    say("HTML 已保存；重新打开时会从阅读模式开始。", true);
  }

  find("#eh-save").addEventListener("click", saveHTML);
  find("#eh-print").addEventListener("click", function () {
    clearImageSelection();
    window.print();
  });

  try {
    document.execCommand("styleWithCSS", false, true);
    document.execCommand("defaultParagraphSeparator", false, "p");
  } catch (error) {}

  setMode("read", true);

  Object.defineProperty(window, "EditableHtmlEditor", {
    configurable: true,
    value: Object.freeze({
      version: VERSION,
      getMode: function () { return mode; },
      setMode: function (nextMode) {
        if (nextMode !== "read" && nextMode !== "edit") {
          throw new TypeError('Mode must be "read" or "edit".');
        }
        setMode(nextMode);
      }
    })
  });
})();
