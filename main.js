// Modules to control application life and create native browser window
const {
    app,
    BrowserWindow,
    dialog,
    ipcMain,
    screen,
    session,
} = require("electron");
app.commandLine.appendSwitch("--disable-http-cache");
const {rootCertificates} = require("tls");
const {exit} = require("process");
const path = require("path");
const fs = require("fs");
const {exec, spawn, execFile} = require("child_process");
const iconPath = path.join(__dirname, "favicon.ico");
const task_server = require(path.join(__dirname, "server.js"));
// const util = require("util");
// const utils=require("./utils.js")
// let config =utils.get_config()
// config = JSON.parse(config);
// let config_context = JSON.parse(
//     fs.readFileSync(path.join(task_server.getDir(), `config.json`), "utf8")
// ); //仅在当前进程中使用，不会写入文件
// console.log(config)
let allWindowSockets = [];
let allWindowScoketNames = [];
let language = "en";
let driver = null;
let mainWindow = null;
let flowchart_window = null;
let current_handle = null;
let old_handles = [];
let handle_pairs = {};
let socket_window = null;
let socket_start = null;
let socket_flowchart = null;
let invoke_window = null;
let server_address='http://localhost:8074'
function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 600,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, "src/js/preload.js"),
        },
        icon: iconPath,
        // frame: false, //取消window自带的关闭最小化等
        resizable: false, //禁止改变主窗口尺寸
    });

    // and load the index.html of the app.
    mainWindow.loadFile('src/index.html');
    // mainWindow.loadURL(
    //     server_address +
    //     "/index.html?user_data_folder=" +
    //     config.user_data_folder +
    //     "&copyright=" +
    //     config.copyright,
    //     {extraHeaders: "pragma: no-cache\n"}
    // );
    // 隐藏菜单栏
    const {Menu} = require("electron");
    Menu.setApplicationMenu(null);
    mainWindow.on("close", function (e) {
        if (process.platform !== "darwin") {
            app.quit();
        }
    });
    // mainWindow.webContents.openDevTools();
    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
}

async function findElementRecursive(driver, by, value, frames) {
    for (const frame of frames) {
        try {
            // Try to switch to the frame
            try {
                await driver.switchTo().frame(frame);
            } catch (error) {
                if (error.name.indexOf("StaleElement") >= 0) {
                    // If the frame is stale, switch to the parent frame and then retry switching to the frame
                    await driver.switchTo().parentFrame();
                    await driver.switchTo().frame(frame);
                } else {
                    // If it is another exception rethrow it
                    throw error;
                }
            }

            let element;
            try {
                // Attempt to find the element in this frame
                element = await driver.findElement(by(value));
                return element;
            } catch (error) {
                if (error.name.indexOf("NoSuchElement") >= 0) {
                    // The element was not found in this frame, recurse into nested iframes
                    const nestedFrames = await driver.findElements(By.tagName("iframe"));
                    if (nestedFrames.length > 0) {
                        element = await findElementRecursive(
                            driver,
                            by,
                            value,
                            nestedFrames
                        );
                        if (element) {
                            return element;
                        }
                    }
                } else {
                    // If it is another exception, log it
                    console.error(`Exception while processing frame: ${error}`);
                }
            }
        } catch (error) {
            console.error(`Exception while processing frame: ${error}`);
        }
    }

    throw new Error(`Element ${value} not found in any frame or iframe`);
}

async function findElement(driver, by, value, iframe = false) {
    // Switch back to the main document
    await driver.switchTo().defaultContent();

    if (iframe) {
        const frames = await driver.findElements(By.tagName("iframe"));
        if (frames.length === 0) {
            throw new Error(
                `No iframes found in the current page while searching for ${value}`
            );
        }
        const element = await findElementRecursive(driver, by, value, frames);
        return element;
    } else {
        // Find element in the main document as normal
        let element = await driver.findElement(by(value));
        return element;
    }
}

async function findElementAcrossAllWindows(
    msg,
    notifyBrowser = true,
    scrollIntoView = true
) {
    let handles = await driver.getAllWindowHandles();
    // console.log("handles", handles);
    let content_handle = current_handle;
    let id = -1;
    try {
        id = msg.message.id;
    } catch {
        id = msg.id;
    }
    if (id == -1) {
        //如果是-1，从当前窗口开始搜索
        content_handle = current_handle;
    } else {
        content_handle = handle_pairs[id];
    }
    // console.log(msg.message.id, content_handle);
    let order = [
        ...handles.filter(
            (handle) => handle != current_handle && handle != content_handle
        ),
        current_handle,
        content_handle,
    ]; //搜索顺序
    let len = order.length;
    let element = null;
    let iframe = false;
    try {
        iframe = msg.message.iframe;
    } catch {
        iframe = msg.iframe;
    }
    // if (iframe) {
    //     notify_browser("在IFrame中执行操作可能需要较长时间，请耐心等待。", "Executing operations in IFrame may take a long time, please wait patiently.", "info");
    // }
    let xpath = "";
    try {
        xpath = msg.message.xpath;
    } catch {
        //如果msg.pathList存在，说明是循环中的元素
        if (
            msg.pathList != undefined &&
            msg.pathList != null &&
            msg.pathList != ""
        ) {
            xpath = msg.pathList[0].trim();
        } else {
            xpath = msg.xpath;
        }
    }
    if (xpath.indexOf("Field(") >= 0 || xpath.indexOf("eval(") >= 0) {
        //两秒后通知浏览器
        await new Promise((resolve) => setTimeout(resolve, 2000));
        notify_browser(
            '检测到XPath中包含Field("")或eval("")，试运行时无法正常定位到包含此两项表达式的元素，请在任务正式运行阶段测试是否有效。',
            'Field("") or eval("") is detected in xpath, and the element containing these two expressions cannot be located normally during trial operation. Please test whether it is valid in the formal call stage.',
            "warning"
        );
        return null;
    }
    let notify = false;
    while (true) {
        // console.log("handles");
        try {
            let h = order[len - 1];
            console.log("current_handle", current_handle);
            if (h != null && handles.includes(h)) {
                await driver.switchTo().window(h);
                current_handle = h;
                console.log("switch to handle: ", h);
            }
            element = await findElement(driver, By.xpath, xpath, iframe);
            break;
        } catch (error) {
            console.log("len", len);
            len = len - 1;
            if (!notify) {
                notify = true;
                // notify_browser("正在尝试在其他窗口中查找元素，请耐心等待。", "Trying to find elements in other windows, please wait patiently.", "info");
            }
            if (len == 0) {
                break;
            }
        }
    }
    if (element == null && notifyBrowser) {
        notify_browser(
            "无法找到元素，请检查XPath是否正确：" + xpath,
            "Cannot find the element, please check if the XPath is correct: " + xpath,
            "warning"
        );
    }
    if (element != null && scrollIntoView) {
        // 浏览器切换到元素位置稍微靠上的位置
        try {
            // let script = `arguments[0].scrollIntoView(true);`;
            let script = `arguments[0].scrollIntoView({block: "center", inline: "center"});`;
            await driver.executeScript(script, element);
        } catch (e) {
            console.log("Cannot scrollIntoView");
        }
    }
    return element;
}

async function beginInvoke(msg, ws) {
    if (msg.type == 1) {
        if (msg.message.id != -1) {
            let url = "";
            if (language == "zh") {
                url =
                    server_address +
                    `/taskGrid/FlowChart_CN.html?id=${msg.message.id}&backEndAddressServiceWrapper=` +
                    server_address;
            } else if (language == "en") {
                url =
                    server_address +
                    `/taskGrid/FlowChart.html?id=${msg.message.id}&backEndAddressServiceWrapper=` +
                    server_address;
            }
            console.log(url);
            flowchart_window.loadURL(url, {extraHeaders: "pragma: no-cache\n"});
        }
        mainWindow.hide();
        // Prints the currently focused window bounds.
        // This method has to be called on macOS before changing the window's bounds, otherwise it will throw an error.
        // It will prompt an accessibility permission request dialog, if needed.
        if (process.platform != "linux" && process.platform != "darwin") {
                const {windowManager} = require("node-window-manager");
                const window = windowManager.getActiveWindow();
                console.log(window);
                windowManager.requestAccessibility();
                // Sets the active window's bounds.
                let size = screen.getPrimaryDisplay().workAreaSize;
                let width = parseInt(size.width);
                let height = parseInt(size.height * 0.6);
                window.setBounds({
                    x: 0,
                    y: size.height * 0.4,
                    height: height,
                    width: width,
                });
        }
        flowchart_window.show();
        // flowchart_window.openDevTools();
    } else if (msg.type == 2) {
        // 键盘输入事件
        // const robot = require("@jitsi/robotjs");
        let keyInfo = msg.message.keyboardStr;
        let enter = false;
        if (/<enter>/i.test(keyInfo)) {
            keyInfo = keyInfo.replace(/<enter>/gi, "");
            enter = true;
        }
        let element = await findElementAcrossAllWindows(
            msg,
            (notifyBrowser = true),
            (scrollIntoView = false)
        );
        await element.sendKeys(Key.HOME, Key.chord(Key.SHIFT, Key.END), keyInfo);
        if (enter) {
            await element.sendKeys(Key.ENTER);
        }
    } else if (msg.type == 3) {
        try {
            if (msg.from == 0) {
                socket_flowchart.send(msg.message.pipe); //直接把消息转接
                let message = JSON.parse(msg.message.pipe);
                let type = message.type;
                console.log("FROM Browser: ", message);
                if (type.indexOf("Click") >= 0 || type.indexOf("Move") >= 0) {
                    let element = await findElementAcrossAllWindows(
                        message,
                        (notifyBrowser = true),
                        (scrollIntoView = false)
                    );
                    if (type.indexOf("Click") >= 0) {
                        await click_element(element, type);
                    } else if (type.indexOf("Move") >= 0) {
                        await driver.actions().move({origin: element}).perform();
                    }
                }
            } else {
                send_message_to_browser(msg.message.pipe);
                console.log("FROM Flowchart: ", JSON.parse(msg.message.pipe));
            }
        } catch (e) {
            console.log(e);
        }
    } else if (msg.type == 4) {
        //标记元素和试运行功能
        let node = JSON.parse(msg.message.node);
        let type = msg.message.type;
        if (type == 0) {
            //标记元素
            let option = node.option;
            let parameters = node.parameters;
            //下面是让浏览器自动滚动到元素位置
            if (option == 2 || option == 4 || option == 6 || option == 7) {
                let xpath = parameters.xpath;
                let parent_node = JSON.parse(msg.message.parentNode);
                if (parameters.useLoop && option != 4 && option != 6) {
                    let parent_xpath = parent_node.parameters.xpath;
                    if (parent_node.parameters.loopType == 2) {
                        parent_xpath = parent_node.parameters.pathList
                            .split("\n")[0]
                            .trim();
                    }
                    xpath = parent_xpath + xpath;
                }
                if (xpath.includes("point(")) {
                    xpath = "//body";
                }
                let elementInfo = {iframe: parameters.iframe, xpath: xpath, id: -1};
                //用于跳转到元素位置
                let element = await findElementAcrossAllWindows(elementInfo);
            } else if (option == 3) {
                let params = parameters.params; //所有的提取数据参数
                let param = params[0];
                let xpath = param.relativeXPath;
                if (param.relative) {
                    let parent_node = JSON.parse(msg.message.parentNode);
                    let parent_xpath = parent_node.parameters.xpath;
                    if (parent_node.parameters.loopType == 2) {
                        parent_xpath = parent_node.parameters.pathList
                            .split("\n")[0]
                            .trim();
                    }
                    xpath = parent_xpath + xpath;
                }
                let elementInfo = {iframe: param.iframe, xpath: xpath, id: -1};
                let element = await findElementAcrossAllWindows(elementInfo);
            } else if (option == 11) {
                let params = parameters.params; //所有的提取数据参数
                let i = parameters.index;
                let param = params[i];
                let xpath = param.relativeXPath;
                if (param.relative) {
                    let parent_node = JSON.parse(msg.message.parentNode);
                    let parent_xpath = parent_node.parameters.xpath;
                    if (parent_node.parameters.loopType == 2) {
                        parent_xpath = parent_node.parameters.pathList
                            .split("\n")[0]
                            .trim();
                    }
                    xpath = parent_xpath + xpath;
                }
                let elementInfo = {iframe: param.iframe, xpath: xpath, id: -1};
                let element = await findElementAcrossAllWindows(elementInfo);
            } else if (option == 8) {
                let loopType = parameters.loopType;
                if (loopType <= 2) {
                    let xpath = "";
                    if (loopType <= 1) {
                        xpath = parameters.xpath;
                    } else if (loopType == 2) {
                        xpath = parameters.pathList.split("\n")[0].trim();
                    }
                    let elementInfo = {iframe: parameters.iframe, xpath: xpath, id: -1};
                    let element = await findElementAcrossAllWindows(elementInfo);
                } else if (loopType == 5) {
                    //JavaScript命令返回值
                    let code = parameters.code;
                    let waitTime = parameters.waitTime;
                    let element = await driver.findElement(By.tagName("body"));
                    let outcome = await execute_js(code, element, waitTime);
                    if (!outcome || outcome == -1) {
                        notify_browser(
                            "目前页面中，设置的循环“" +
                            node.title +
                            "”的JavaScript条件不成立",
                            "The condition of the loop " +
                            node.title +
                            " is not met, skip this loop.",
                            "warning"
                        );
                    } else {
                        notify_browser(
                            "目前页面中，设置的循环“" + node.title + "”的JavaScript条件成立",
                            "The condition of the loop " +
                            node.title +
                            " is met, continue this loop.",
                            "success"
                        );
                    }
                }
            } else if (option == 10) {
                //条件分支
                let condition = parameters.class; //条件类型
                let result = -1;
                let additionalInfo = "";
                if (condition == 5 || condition == 7) {
                    //JavaScript命令返回值
                    let code = parameters.code;
                    let waitTime = parameters.waitTime;
                    let element = await driver.findElement(By.tagName("body"));
                    if (condition == 7) {
                        let parent_node = JSON.parse(msg.message.parentNode);
                        let parent_xpath = parent_node.parameters.xpath;
                        if (parent_node.parameters.loopType == 2) {
                            parent_xpath = parent_node.parameters.pathList
                                .split("\n")[0]
                                .trim();
                        }
                        let elementInfo = {
                            iframe: parent_node.parameters.iframe,
                            xpath: parent_xpath,
                            id: -1,
                        };
                        element = await findElementAcrossAllWindows(elementInfo);
                    }
                    let outcome = await execute_js(code, element, waitTime);
                    if (!outcome) {
                        msg.message.result = 0; //条件不成立传入扩展
                    } else if (outcome == -1) {
                        msg.message.result = -1; //JS执行出错
                    } else {
                        msg.message.result = 1; //条件成立传入扩展
                    }
                }
            }
            send_message_to_browser(JSON.stringify({type: "trial", message: msg}));
        } else {
            //试运行
            try {
                let flowchart_url = flowchart_window.webContents.getURL();
            } catch {
                flowchart_window = null;
            }
            if (flowchart_window == null) {
                notify_flowchart(
                    "试运行功能只能在任务设计阶段，Chrome浏览器打开时使用！",
                    "The trial run function can only be used when designing tasks and opening in Chrome browser!",
                    "error"
                );
            } else {
                notify_browser(
                    "正在试运行操作：" + node.title,
                    "Trying to run the operation: " + node.title,
                    "info"
                );
                let option = node.option;
                let parameters = node.parameters;
                let beforeJS = "";
                let beforeJSWaitTime = 0;
                let afterJS = "";
                let afterJSWaitTime = 0;
                try {
                    beforeJS = parameters.beforeJS;
                    beforeJSWaitTime = parameters.beforeJSWaitTime;
                    afterJS = parameters.afterJS;
                    afterJSWaitTime = parameters.afterJSWaitTime;
                } catch (e) {
                    console.log(e);
                }
                if (option == 1) {
                    let url = parameters.links.split("\n")[0].trim();
                    if (parameters.useLoop) {
                        let parent_node = JSON.parse(msg.message.parentNode);
                        url = parent_node["parameters"]["textList"].split("\n")[0];
                    }
                    try {
                        await driver.get(url);
                    } catch (e) {
                        try {
                            await driver.switchTo().window(current_handle);
                            await driver.get(url);
                        } catch (e) {
                            let all_handles = await driver.getAllWindowHandles();
                            let handle = all_handles[all_handles.length - 1];
                            await driver.switchTo().window(handle);
                            await driver.get(url);
                        }
                    }
                } else if (option == 2 || option == 7) {
                    //点击事件
                    let xpath = parameters.xpath;
                    let point = parameters.xpath;
                    if (xpath.includes("point(")) {
                        xpath = "//body";
                    }
                    let elementInfo = {iframe: parameters.iframe, xpath: xpath, id: -1};
                    if (parameters.useLoop && !parameters.xpath.includes("point(")) {
                        let parent_node = JSON.parse(msg.message.parentNode);
                        let parent_xpath = parent_node.parameters.xpath;
                        if (parent_node.parameters.loopType == 2) {
                            parent_xpath = parent_node.parameters.pathList
                                .split("\n")[0]
                                .trim();
                        }
                        elementInfo.xpath = parent_xpath + elementInfo.xpath;
                    }
                    let element = await findElementAcrossAllWindows(
                        elementInfo,
                        (notifyBrowser = false)
                    ); //通过此函数找到元素并切换到对应的窗口
                    await execute_js(
                        parameters.beforeJS,
                        element,
                        parameters.beforeJSWaitTime
                    );
                    if (option == 2) {
                        if (parameters.xpath.includes("point(")) {
                            await click_element(element, point);
                        } else {
                            await click_element(element);
                        }
                        let alertHandleType = parameters.alertHandleType;
                        if (alertHandleType == 1) {
                            try {
                                await driver.switchTo().alert().accept();
                            } catch (e) {
                                console.log("No alert");
                            }
                        } else if (alertHandleType == 2) {
                            try {
                                await driver.switchTo().alert().dismiss();
                            } catch (e) {
                                console.log("No alert");
                            }
                        }
                    } else if (option == 7) {
                        await driver.actions().move({origin: element}).perform();
                    }
                    await execute_js(
                        parameters.afterJS,
                        element,
                        parameters.afterJSWaitTime
                    );
                    send_message_to_browser(JSON.stringify({type: "cancelSelection"}));
                } else if (option == 3) {
                    //提取数据
                    notify_browser(
                        "提示：提取数据操作只能试运行设置的JavaScript语句，且只针对第一个匹配的元素。",
                        "Hint: can only test JavaScript  statement set in the data extraction operation, and only for the first matching element.",
                        "info"
                    );
                    let params = parameters.params; //所有的提取数据参数
                    let not_found_xpaths = [];
                    for (let i = 0; i < params.length; i++) {
                        let param = params[i];
                        let xpath = param.relativeXPath;
                        if (param.relative) {
                            let parent_node = JSON.parse(msg.message.parentNode);
                            let parent_xpath = parent_node.parameters.xpath;
                            if (parent_node.parameters.loopType == 2) {
                                parent_xpath = parent_node.parameters.pathList
                                    .split("\n")[0]
                                    .trim();
                            }
                            xpath = parent_xpath + xpath;
                        }
                        let elementInfo = {iframe: param.iframe, xpath: xpath, id: -1};
                        let element = await findElementAcrossAllWindows(
                            elementInfo,
                            (notifyBrowser = false)
                        );
                        if (element != null) {
                            await execute_js(param.beforeJS, element, param.beforeJSWaitTime);
                            await execute_js(param.afterJS, element, param.afterJSWaitTime);
                        } else {
                            not_found_xpaths.push(xpath);
                        }
                    }
                    if (not_found_xpaths.length > 0) {
                        notify_browser(
                            "无法找到以下元素，请检查XPath是否正确：" +
                            not_found_xpaths.join("\n"),
                            "Cannot find the element, please check if the XPath is correct: " +
                            not_found_xpaths.join("\n"),
                            "warning"
                        );
                    }
                } else if (option == 4) {
                    //键盘输入事件
                    let elementInfo = {
                        iframe: parameters.iframe,
                        xpath: parameters.xpath,
                        id: -1,
                    };
                    let value = node.parameters.value;
                    if (node.parameters.useLoop) {
                        let parent_node = JSON.parse(msg.message.parentNode);
                        value = parent_node["parameters"]["textList"].split("\n")[0];
                        let index = node.parameters.index;
                        if (index > 0) {
                            value = value.split("~")[index - 1];
                        }
                    }
                    let keyInfo = value;
                    let enter = false;
                    if (/<enter>/i.test(keyInfo)) {
                        keyInfo = keyInfo.replace(/<enter>/gi, "");
                        enter = true;
                    }
                    // 如果返回值中包含JS
                    if (/JS\(/i.test(keyInfo)) {
                        // 创建一个新的正则表达式来匹配JS语句
                        let pattern = /JS\("(.+?)"\)/gi;

                        // 找出所有的匹配项
                        let matches = [...keyInfo.matchAll(pattern)];

                        // 处理每一个匹配项
                        for (let match of matches) {
                            // 执行 JS 代码并等待结果
                            let jsReplacedText = await execute_js(match[1], null, 0);
                            // 替换匹配到的 JS 语句
                            keyInfo = keyInfo.replace(match[0], jsReplacedText.toString());
                        }
                    }
                    if (keyInfo.indexOf("Field(") >= 0 || keyInfo.indexOf("eval(") >= 0) {
                        //两秒后通知浏览器
                        await new Promise((resolve) => setTimeout(resolve, 2000));
                        notify_browser(
                            '检测到文字中包含Field("")或eval("")，试运行时无法输入两项表达式的替换值，请在任务正式运行阶段测试是否有效。',
                            'Field("") or eval("") is detected in the text, and the replacement value of the two expressions cannot be entered during trial operation. Please test whether it is valid in the formal call stage.',
                            "warning"
                        );
                    }
                    let element = await findElementAcrossAllWindows(
                        elementInfo,
                        (notifyBrowser = false)
                    );
                    await execute_js(beforeJS, element, beforeJSWaitTime);
                    await element.sendKeys(
                        Key.HOME,
                        Key.chord(Key.SHIFT, Key.END),
                        keyInfo
                    );
                    if (enter) {
                        await element.sendKeys(Key.ENTER);
                    }
                    await execute_js(afterJS, element, afterJSWaitTime);
                } else if (option == 5) {
                    //自定义操作的JS代码
                    let code = parameters.code;
                    let codeMode = parameters.codeMode;
                    let waitTime = parameters.waitTime;
                    let element = await driver.findElement(By.tagName("body"));
                    if (codeMode == 0) {
                        let result = await execute_js(code, element, waitTime);
                        let level = "success";
                        if (result == -1) {
                            level = "info";
                        }
                        if (result != null) {
                            notify_browser(
                                "JavaScript操作返回结果：" + result,
                                "JavaScript operation returns result: " + result,
                                level
                            );
                        }
                    } else if (codeMode == 2) { // 循环内的JS代码
                        let parent_node = JSON.parse(msg.message.parentNode);
                        let parent_xpath = parent_node.parameters.xpath;
                        if (parent_node.parameters.loopType == 2) {
                            parent_xpath = parent_node.parameters.pathList
                                .split("\n")[0]
                                .trim();
                        }
                        let elementInfo = {iframe: parameters.iframe, xpath: parent_xpath, id: -1};
                        let element = await findElementAcrossAllWindows(
                            elementInfo, notifyBrowser = false); //通过此函数找到元素并切换到对应的窗口
                        let result = await execute_js(code, element, waitTime);
                        let level = "success";
                        if (result == -1) {
                            level = "info";
                        }
                        if (result != null) {
                            notify_browser(
                                "JavaScript操作返回结果：" + result,
                                "JavaScript operation returns result: " + result,
                                level
                            );
                        }
                    } else if (codeMode == 8) {
                        //刷新页面
                        try {
                            await driver.navigate().refresh();
                        } catch (e) {
                            try {
                                await driver.switchTo().window(current_handle);
                                await driver.navigate().refresh();
                            } catch (e) {
                                let all_handles = await driver.getAllWindowHandles();
                                let handle = all_handles[all_handles.length - 1];
                                await driver.switchTo().window(handle);
                                await driver.navigate().refresh();
                            }
                        }
                    }
                } else if (option == 6) {
                    //切换下拉选项
                    let optionMode = parseInt(parameters.optionMode);
                    let optionValue = parameters.optionValue;
                    if (node.parameters.useLoop) {
                        let parent_node = JSON.parse(msg.message.parentNode);
                        optionValue = parent_node["parameters"]["textList"].split("\n")[0];
                        let index = node.parameters.index;
                        if (index > 0) {
                            optionValue = optionValue.split("~")[index - 1];
                        }
                    }
                    let elementInfo = {
                        iframe: parameters.iframe,
                        xpath: parameters.xpath,
                        id: -1,
                    };
                    let element = await findElementAcrossAllWindows(
                        elementInfo,
                        (notifyBrowser = false)
                    );
                    execute_js(beforeJS, element, beforeJSWaitTime);
                    let dropdown = new Select(element);
                    // Interacting with dropdown element based on optionMode
                    switch (optionMode) {
                        case 0: //切换到下一个选项
                            let script = `var options = arguments[0].options;
                        for (var i = 0; i < options.length; i++) {
                            if (options[i].selected) {
                                options[i].selected = false;
                                if (i == options.length - 1) {
                                    options[0].selected = true;
                                } else {
                                    options[i + 1].selected = true;
                                }
                                break;
                            }
                        }`;
                            await driver.executeScript(script, element);
                            break;
                        case 1:
                            await dropdown.selectByIndex(parseInt(optionValue));
                            break;
                        case 2:
                            await dropdown.selectByValue(optionValue);
                            break;
                        case 3:
                            await dropdown.selectByVisibleText(optionValue);
                            break;
                        default:
                            throw new Error("Invalid option mode");
                    }
                    execute_js(afterJS, element, afterJSWaitTime);
                } else if (option == 11) {
                    //单个提取数据参数
                    // notify_browser(
                    //     "提示：提取数据字段的试运行操作只针对第一个匹配的元素。",
                    //     "Hint: can only test the trial operation of the data extraction field for the first matching element.",
                    //     "info"
                    // );
                    let params = parameters.params; //所有的提取数据参数
                    let i = parameters.index;
                    let param = params[i];
                    let xpath = param.relativeXPath;
                    if (param.relative) {
                        let parent_node = JSON.parse(msg.message.parentNode);
                        let parent_xpath = parent_node.parameters.xpath;
                        if (parent_node.parameters.loopType == 2) {
                            parent_xpath = parent_node.parameters.pathList
                                .split("\n")[0]
                                .trim();
                        }
                        xpath = parent_xpath + xpath;
                    }
                    let elementInfo = {iframe: param.iframe, xpath: xpath, id: -1};
                    let element = await findElementAcrossAllWindows(elementInfo);
                    if (element != null) {
                        await execute_js(param.beforeJS, element, param.beforeJSWaitTime);
                        if (param.contentType == 0) {
                            let result = await element.getText();  // 获取元素及其子元素的文本内容
                            if (param.nodeType == 2) { //链接地址
                                result = await element.getAttribute("href");
                                notify_browser("获取的链接地址：" + result, "Link URL obtained: " + result, "success")
                            } else if (param.nodeType == 3) { //表单值
                                result = await element.getAttribute("value");
                                notify_browser("获取的表单值：" + result, "Form value obtained: " + result, "success")
                            } else if (param.nodeType == 4) { //图片地址
                                result = await element.getAttribute("src");
                                notify_browser("获取的图片地址：" + result, "Image URL obtained: " + result, "success")
                            } else {
                                notify_browser("获取的文本内容：" + result, "Text content obtained: " + result, "success");
                            }
                        } else if (param.contentType == 1) {
                            // 对于Selenium，获取不包括子元素的文本可能需要特殊处理，这里假设element是父元素
                            let command = 'var arr = [];\
                                var content = arguments[0];\
                                for(var i = 0, len = content.childNodes.length; i < len; i++) {\
                                    if(content.childNodes[i].nodeType === 3){  \
                                        arr.push(content.childNodes[i].nodeValue);\
                                    }\
                                }\
                                var str = arr.join(" "); \
                                return str;'
                            let result = await execute_js(command, element, 0);
                            result = result.replace(/\n/g, "").replace(/\s+/g, " ");
                            notify_browser("获取的内容：" + result, "Content obtained: " + result, "success");
                        } else if (param.contentType == 2) {
                            let result = await element.getAttribute('innerHTML');  // 获取元素的内部HTML内容
                            notify_browser("获取的innerHTML：" + result, "innerHTML obtained: " + result, "success");
                        } else if (param.contentType == 3) {
                            let result = await element.getAttribute('outerHTML');  // 获取元素及其内容的HTML表示
                            notify_browser("获取的outerHTML：" + result, "outerHTML obtained: " + result, "success");
                        } else if (param.contentType == 4) {
                            let result = await element.getCssValue('background-image');  // 获取元素的背景图片地址
                            notify_browser("获取的背景图片地址：" + result, "Background image URL obtained: " + result, "success");
                        } else if (param.contentType == 5) {
                            let result = await driver.getCurrentUrl();  // 获取页面的网址
                            notify_browser("获取的页面网址：" + result, "Page URL obtained: " + result, "success");
                        } else if (param.contentType == 6) { //页面标题
                            let result = await driver.getTitle();
                            notify_browser("获取的页面标题：" + result, "Page title obtained: " + result, "success");
                        } else if (param.contentType == 9) { //针对元素的JavaScript代码返回值
                            let result = await execute_js(param.JS, element);
                            let level = "success";
                            if (result == -1) {
                                level = "info";
                            }
                            if (result != null) {
                                notify_browser(
                                    "JavaScript操作返回结果：" + result,
                                    "JavaScript operation returns result: " + result,
                                    level
                                );
                            }
                        } else if (param.contentType == 10) {
                            // 当前选择框选中的选项值
                            let result = await element.getAttribute("value");
                            notify_browser(
                                "获取的选项值：" + result,
                                "Option value obtained: " + result,
                                "success"
                            );
                        } else if (param.contentType == 11) {
                            // 当前选择框选中的选项文本
                            let selectElement = new Select(element);
                            // 等待选项变得可选，这是可选的，根据页面加载情况
                            await driver.wait(until.elementIsEnabled(element));
                            // 获取当前选中的选项元素
                            let selectedOption = await selectElement.getFirstSelectedOption();
                            // 获取选项的文本内容
                            let content = await selectedOption.getText();
                            notify_browser(
                                "获取的选项文本：" + content,
                                "Option text obtained: " + content,
                                "success"
                            );
                        } else if (param.contentType == 14) {
                            //元素的属性值
                            let result = await element.getAttribute(param.JS);
                            notify_browser(
                                "获取的属性值：" + result,
                                "Attribute value obtained: " + result,
                                "success"
                            );
                        } else {
                            //其他暂不支持
                            notify_browser(
                                "暂不支持测试此类型的数据提取，请在任务正式运行阶段测试是否有效。",
                                "This type of data extraction is not supported for testing. Please test whether it is valid in the formal call stage.",
                                "warning"
                            );
                        }
                        await execute_js(param.afterJS, element, param.afterJSWaitTime);
                    }
                }
            }
        }
    } else if (msg.type == 5) {
        let child = require("child_process").execFile;
        // 参数顺序： 1. task id 2. server address 3. saved_file_name 4. "remote" or "local" 5. user_data_folder
        // var parameters = [msg.message.id, server_address];
        let parameters = [];
        console.log(msg.message);
        if (
            msg.message.user_data_folder == null ||
            msg.message.user_data_folder == undefined ||
            msg.message.user_data_folder == ""
        ) {
            parameters = [
                "--ids",
                "[" + msg.message.id + "]",
                "--server_address",
                server_address,
                "--user_data",
                0,
            ];
        } else {
            let user_data_folder_path = path.join(
                task_server.getDir(),
                msg.message.user_data_folder
            );
            parameters = [
                "--ids",
                "[" + msg.message.id + "]",
                "--server_address",
                server_address,
                "--user_data",
                1,
            ];
            config.user_data_folder = msg.message.user_data_folder;
            config.absolute_user_data_folder = user_data_folder_path;
            fs.writeFileSync(
                path.join(task_server.getDir(), "config.json"),
                JSON.stringify(config)
            );
        }
        if (msg.message.mysql_config_path != "-1") {
            config.mysql_config_path = msg.message.mysql_config_path;
        }
        fs.writeFileSync(
            path.join(task_server.getDir(), "config.json"),
            JSON.stringify(config)
        );
        // child('Chrome/easyspider_executestage.exe', parameters, function(err,stdout, stderr) {
        //    console.log(stdout);
        // });

        let spawn = require("child_process").spawn;
        if (
            process.platform != "darwin" &&
            msg.message.execute_type == 1 &&
            msg.message.id != -1
        ) {
            let child_process = spawn(execute_path, parameters);
            child_process.stdout.on("data", function (data) {
                console.log(data.toString());
            });
        }
        ws.send(
            JSON.stringify({
                config_folder: task_server.getDir() + "/",
                easyspider_location: task_server.getEasySpiderLocation(),
            })
        );
    } else if (msg.type == 6) {
        try {
            flowchart_window.openDevTools();
        } catch {
            console.log("open devtools error");
        }
        try {
            invoke_window.openDevTools();
        } catch {
            console.log("open devtools error");
        }
    } else if (msg.type == 7) {
        // 获得当前页面Cookies
        try {
            let cookies = await driver.manage().getCookies();
            console.log("Cookies: ", cookies);
            let cookiesText = cookies
                .map((cookie) => `${cookie.name}=${cookie.value}`)
                .join("\n");
            socket_flowchart.send(
                JSON.stringify({type: "GetCookies", message: cookiesText})
            );
        } catch {
            console.log("Cannot get Cookies");
        }
    }
}

async function click_element(element, type = "click") {
    try {
        if (type == "loopClickEvery") {
            await driver
                .actions()
                .keyDown(Key.CONTROL)
                .click(element)
                .keyUp(Key.CONTROL)
                .perform();
        } else if (type.includes("point(")) {
            //point(10, 20)表示点击坐标为(10, 20)的位置
            let point = type.substring(6, type.length - 1).split(",");
            let x = parseInt(point[0]);
            let y = parseInt(point[1]);
            // let actions = driver.actions();
            // await actions.move({origin: element}).perform();
            // await actions.move({x: x, y: y}).perform();
            // await actions.click().perform();
            let script = `document.elementFromPoint(${x}, ${y}).click();`;
            await driver.executeScript(script);
        } else {
            await element.click();
        }
    } catch (e) {
        console.log(e);
        await driver.executeScript("arguments[0].click();", element);
    }
}

async function execute_js(js, element, wait_time = 3) {
    let outcome = 0;
    if (js.length != 0) {
        try {
            outcome = await driver.executeScript(js, element);
            if (wait_time == 0) {
                wait_time = 30000;
            }
            // await new Promise(resolve => setTimeout(resolve, wait_time));
        } catch (e) {
            // await new Promise(resolve => setTimeout(resolve, 2000));
            notify_browser(
                "执行JavaScript出错，请检查JavaScript语句是否正确：" +
                js +
                "\n错误信息：" +
                e,
                "Error executing JavaScript, please check if the JavaScript statement is correct: " +
                js +
                "\nError message: " +
                e,
                "error"
            );
            outcome = -1;
        }
        if (js.indexOf("Field(") >= 0 || js.indexOf("eval(") >= 0) {
            //两秒后通知浏览器
            await new Promise((resolve) => setTimeout(resolve, 2000));
            notify_browser(
                '检测到JavaScript中包含Field("")或eval("")，试运行时无法执行两项表达式，请在任务正式运行阶段测试是否有效。',
                'Field("") or eval("") is detected in JavaScript, and the two expressions cannot be executed during trial operation. Please test whether it is valid in the formal call stage.',
                "warning"
            );
        }
    }
    return outcome;
}

function notify_flowchart(msg_zh, msg_en, level = "info") {
    socket_flowchart.send(
        JSON.stringify({
            type: "notify",
            level: level,
            msg_zh: msg_zh,
            msg_en: msg_en,
        })
    );
}

function notify_browser(msg_zh, msg_en, level = "info") {
    if (msg_zh.split("：").length > 1 && msg_zh.split("：")[1].includes("null")) {
        level = "warning";
    }
    send_message_to_browser(
        JSON.stringify({
            type: "notify",
            level: level,
            msg_zh: msg_zh,
            msg_en: msg_en,
        })
    );
}

function send_message_to_browser(message) {
    socket_window.send(message);
    for (let i in allWindowSockets) {
        try {
            allWindowSockets[i].send(message);
        } catch {
            console.log("Cannot send to socket with id: ", allWindowScoketNames[i]);
        }
    }
}


console.log(process.platform);


function handleOpenBrowser(
    event,
    lang = "en",
    user_data_folder = "",
    mobile = false
) {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    // runBrowser(lang, user_data_folder, mobile);
    let size = screen.getPrimaryDisplay().workAreaSize;
    let width = parseInt(size.width);
    let height = parseInt(size.height);
    flowchart_window = new BrowserWindow({
        x: 0,
        y: 0,
        width: width,
        height: height,
        icon: iconPath,
        maximizable: true,
        resizable: true,
    });
    let url = "";
    let id = -1;
    url =
        server_address +
        `/taskGrid/FlowChart_CN.html?id=${id}&backEndAddressServiceWrapper=` +
        server_address +
        "&mobile=" +
        mobile.toString();
    console.log(url)
    // and load the index.html of the app.
    flowchart_window.loadURL(url, {extraHeaders: "pragma: no-cache\n"});
    if (process.platform != "darwin") {
        // flowchart_window.hide();
    }
    flowchart_window.on("close", function (event) {
        mainWindow.show();
        // driver.quit();
    });
}

function handleOpenInvoke(event, lang = "en") {
    invoke_window = new BrowserWindow({icon: iconPath});
    let url = "";
    language = lang;
    url =
        server_address +
        `/taskGrid/taskList.html?type=1&backEndAddressServiceWrapper=` +
        server_address +
        "&lang=zh";
    // and load the index.html of the app.
    invoke_window.loadURL(url, {extraHeaders: "pragma: no-cache\n"});
    invoke_window.maximize();
    mainWindow.hide();
    invoke_window.on("close", function (event) {
        mainWindow.show();
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders["Accept-Language"] = "zh";
        callback({cancel: false, requestHeaders: details.requestHeaders});
    });
    ipcMain.on("start-design", handleOpenBrowser);
    ipcMain.on("start-invoke", handleOpenInvoke);
    ipcMain.on("accept-agreement", function (event, arg) {
        config.copyright = 1;
        // fs.writeFileSync(
        //     path.join(task_server.getDir(), "config.json"),
        //     JSON.stringify(config)
        // );
    });
    createWindow();

    app.on("activate", function () {
        // On MacOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
    if (process.platform === "darwin") {
        // 获取Chrome版本
        execFile(chromeBinaryPath, ["--version"], (error, chromeStdout) => {
            if (error) {
                dialog.showErrorBox("Chrome Error", "Failed to retrieve Chrome version.");
                return;
            }

            // Chrome的版本输出通常是 "Google Chrome xx.x.xxx.x"
            const chromeVersionMatch = chromeStdout.match(/\d+/);
            if (!chromeVersionMatch) {
                dialog.showErrorBox("Chrome Error", "Unable to parse Chrome version.");
                return;
            } else {
                console.log("\n\n\nChrome version: ", chromeVersionMatch[0]);
            }
            const chromeVersion = chromeVersionMatch[0];

            // 获取ChromeDriver版本
            execFile(driverPath, ["--version"], (error, chromedriverStdout) => {
                if (error) {
                    dialog.showErrorBox(
                        "ChromeDriver Error",
                        "Failed to retrieve ChromeDriver version."
                    );
                    return;
                } else {
                    console.log("\n\n\nChromeDriver version: ", chromedriverStdout);
                }

                // ChromeDriver的版本输出通常是 "ChromeDriver xx.x.xxx.x (更多信息)"
                const chromedriverVersionMatch =
                    chromedriverStdout.match(/\d+\.\d+\.\d+\.\d+/);
                if (!chromedriverVersionMatch) {
                    dialog.showErrorBox(
                        "ChromeDriver Error",
                        "Unable to parse ChromeDriver version."
                    );
                    return;
                }
                const chromedriverVersion = chromedriverVersionMatch[0];

                // 检查主版本号是否匹配
                if (chromeVersion.split(".")[0] !== chromedriverVersion.split(".")[0]) {
                    dialog.showErrorBox(
                        "ChromeDriver版本不匹配\nChromeDriver Version Mismatch",
                        `由于MacOS的自动升级策略，导致了当前的Chrome的版本被自动更新到了${chromeVersion}，与软件自带的ChromeDriver的版本（${chromedriverVersion}）不匹配，软件将无法正常使用。请阅读文件夹下的“浏览器闪退解决方案.txt”升级ChromeDriver到${chromeVersion}.*版本以正常使用软件。\n\nThe current version of Chrome has been automatically updated to ${chromeVersion} due to the automatic update policy of MacOS, which does not match the version of ChromeDriver (${chromedriverVersion}) provided by the software. The software will not work properly. Please read the "Browser Crash Solution.txt" in the folder to upgrade ChromeDriver to ${chromeVersion}.* version to use the software normally.`
                    );
                } else {
                    // 版本匹配，继续应用流程
                }
            });
        });
    }

});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function arrayDifference(arr1, arr2) {
    return arr1.filter((item) => !arr2.includes(item));
}
