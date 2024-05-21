const http = require("http");
const querystring = require("querystring");
const url = require("url");
const fs = require("fs");
const path = require("path");
// const { app, dialog } = require("electron");
const express = require("express");
const cors = require("cors");
// const {collectSingle} = require("./EasySpider_zh/content-scripts/messageInteraction");
const util = require("util");
const utils=require("./utils.js")
const {json} = require("express");
const mysql = require('mysql');

// 创建MySQL连接配置
const connectionConfig = {
  host: '172.2.0.54',
  user: 'ke',
  password: 'wens',
  database: 'ke_spider'
};

// 创建MySQL连接池
connection = mysql.createConnection(connectionConfig);
connection.connect();
// const
function travel(dir, callback) {
  fs.readdirSync(dir).forEach((file) => {
    const pathname = path.join(dir, file);
    if (fs.statSync(pathname).isDirectory()) {
      travel(pathname, callback);
    } else {
      callback(pathname);
    }
  });
}
function compare(p) {
  //这是比较函数
  return function (m, n) {
    let a = m[p];
    let b = n[p];
    return b - a; //降序
  };
}

function getDir() {
  if (__dirname.indexOf("app") >= 0 && __dirname.indexOf("sources") >= 0) {
    if (process.platform == "darwin") {
      return app.getPath("userData");
    } else {
      return path.join(__dirname, "../../..");
    }
  } else {
    return __dirname;
  }
}
function getEasySpiderLocation() {
  if (__dirname.indexOf("app") >= 0 && __dirname.indexOf("sources") >= 0) {
    if (process.platform == "darwin") {
      return path.join(__dirname, "../../../");
    } else {
      return path.join(__dirname, "../../../");
    }
  } else {
    return __dirname;
  }
}
if (!fs.existsSync(path.join(getDir(), "tasks"))) {
  fs.mkdirSync(path.join(getDir(), "tasks"));
}
if (!fs.existsSync(path.join(getDir(), "execution_instances"))) {
  fs.mkdirSync(path.join(getDir(), "execution_instances"));
}
if (!fs.existsSync(path.join(getDir(), "config.json"))) {
  // Generate config.json
  fs.writeFileSync(
    path.join(getDir(), "config.json"),
    JSON.stringify({
      webserver_address: "http://172.167.0.227",
      webserver_port: 8074,
      user_data_folder: "./user_data",
      debug: false,
      copyright: 0,
      sys_arch: require("os").arch(),
      mysql_config_path: "./mysql_config.json",
      absolute_user_data_folder:
        "D:\\Document\\Projects\\EasySpider\\ElectronJS\\user_data",
    })
  );
}

exports.getDir = getDir;
exports.getEasySpiderLocation = getEasySpiderLocation;
FileMimes = JSON.parse(
  fs.readFileSync(path.join(__dirname, "mime.json")).toString()
);

const fileServer = express();

fileServer.use(cors());
output = utils.queryTasks();
console.log(output)
start = function (port = 8074) {
  http.createServer(function (req, res) {
      let body = "";
      res.setHeader("Access-Control-Allow-Origin", "*"); // 设置可访问的源
      // 解析参数
      const pathName = url.parse(req.url).pathname;
      if (pathName == "/excelUpload" && req.method.toLowerCase() === "post") {
      } else if (pathName.indexOf(".") < 0) {
        //如果没有后缀名, 则为后台请求
        console.log(1222222)
        res.writeHead(200, { "Content-Type": "application/json" });
      }
      else {
        //如果有后缀名, 则为前端请求
        // console.log(path.join(__dirname,"src/taskGrid", pathName));
        fs.readFile(
          path.join(__dirname, "src", pathName),
          async (err, data) => {
            if (err) {
              res.writeHead(404, {
                "Content-Type": 'text/html;charset="utf-8"',
              });
              res.end(err.message);
              return;
            }
            if (!err) {
              // 3. 针对不同的文件返回不同的内容头
              let extname = path.extname(pathName);
              let mime = FileMimes[extname];
              res.writeHead(200, { "Content-Type": mime + ';charset="utf-8"' });
              res.end(data);
              return;
            }
          }
        );
      }

      req.on("data", function (chunk) {
        body += chunk;
      });
      req.on("end", function () {
        // 设置响应头部信息及编码
        if (pathName == "/queryTasks") {
          const sql='select * from tasks '
          connection.query(sql,function(err,results){
            if(err){
              console.log('[SELECT ERROR] - ', err.message);
              return;
            }
            out_put=[]
            for (let i = 0; i < results.length; i++) {
                let item = {
                  id: results[i].id,
                  name:  results[i].name,
                  url:  results[i].url,
                  mtime:  results[i].create_time,
                  links:  results[i].url,
                  desc:  results[i].desc,
                };
                out_put.push(item)
              }
            console.log(out_put)
            res.write(JSON.stringify(out_put));
            res.end();
          });
        } else if (pathName == "/queryOSVersion") {
          res.write(
            JSON.stringify({ version: process.platform, bit: process.arch })
          );
          res.end();
        } else if (pathName == "/queryExecutionInstances") {
          //查询所有服务信息，只包括id和服务名称
          output = [];
          travel(
            path.join(getDir(), "execution_instances"),
            function (pathname) {
              const data = fs.readFileSync(pathname, "utf8");
              // parse JSON string to JSON object
              const task = JSON.parse(data);
              let item = {
                id: task.id,
                name: task.name,
                url: task.url,
              };
              if (item.id != -2) {
                output.push(item);
              }
            }
          );
          res.write(JSON.stringify(output));
          res.end();
        } else if (pathName == "/queryTask") {
          let params = url.parse(req.url, true).query;
          try {
            let tid = parseInt(params.id);
            const sql='select config from tasks where id='+tid
            console.log(sql)
            connection.query(sql,function(err,results){
              if(err){
                console.log('[SELECT ERROR] - ', err.message);
                return;
              }
              console.log(results[0]['config'])
              res.write(results[0]['config']);
              res.end();
            });
          } catch (error) {
            res.write(
              JSON.stringify({
                error: "Cannot find task based on specified task ID.",
              })
            );
            res.end();
          }
        } else if (pathName == "/queryExecutionInstance") {
          let params = url.parse(req.url, true).query;
          try {
            let tid = parseInt(params.id);
            const data = fs.readFileSync(
              path.join(getDir(), `execution_instances/${tid}.json`),
              "utf8"
            );
            // parse JSON string to JSON object
            res.write(data);
            res.end();
          } catch (error) {
            res.write(
              JSON.stringify({
                error:
                  "Cannot find execution instance based on specified execution ID.",
              })
            );
            res.end();
          }
        } else if (pathName == "/") {
          res.write("Hello 111111!", "utf8");
          res.end();
        } else if (pathName == "/deleteTask") {

        } else if (pathName == "/manageTask") {
          body = querystring.parse(body);
          data = JSON.parse(body.params);
          console.log(data);
          let id = data["id"];
          const sql='select id from tasks where id='+id
          console.log(sql)
          if (id==-1){
            var  addSql = 'INSERT INTO tasks(url,name,config) VALUES(?,?,?)';
            var  addSqlParams = [data['url'], data['name'],JSON.stringify(data)];
            connection.query(addSql,addSqlParams,function (err, result) {
              if(err){
                console.log('[INSERT ERROR] - ',err.message);
                return;
              }
              data['id']=result.insertId
              console.log('INSERT ID:',result.insertId);
            });
          }else {
            connection.query(sql,function(err,results){
              if(err){
                console.log('[SELECT ERROR] - ', err.message);
                return;
              }
              if (results){
                var  addSql = 'UPDATE tasks SET name = ?,url = ?,config = ? WHERE Id = ?';
                var  addSqlParams = [data['name'],data['url'],data,id];
                connection.query(addSql,addSqlParams,function (err, result) {
                  if(err){
                    console.log('[UPDATE ERROR] - ',err.message);
                    return;
                  }
                  console.log('UPDATE ID:',result.insertId);
                });
              }else {
                var  addSql = 'INSERT INTO tasks(id,url,name,config) VALUES(?,?,?,?)';
                var  addSqlParams = [id,data['url'], data['name'],JSON.stringify(data)];
                connection.query(addSql,addSqlParams,function (err, result) {
                  if(err){
                    console.log('[INSERT ERROR] - ',err.message);
                    return;
                  }
                  console.log('INSERT ID:',result.insertId);
                });
              }
            });
          }
          console.log('111111')
          console.log(data)
          data = JSON.stringify(data);
          // write JSON string to a file
          fs.writeFile(
            path.join(getDir(), `tasks/${id}.json`),
            data,
            (err) => {}
          );

          res.write(id.toString(), "utf8");
          res.end();
        } else if (pathName == "/invokeTask") {
          body = querystring.parse(body);
          console.log(body)
          let data = JSON.parse(body.params);
          let id = body.id;
          let task = fs.readFileSync(
            path.join(getDir(), `tasks/${id}.json`),
            "utf8"
          );
          task = JSON.parse(task);
          try {
            task["links"] = data["urlList_0"];
            if (task["links"] == undefined) {
              task["links"] = "about:blank";
            }
          } catch (error) {
            task["links"] = "about:blank";
          }
          for (const [key, value] of Object.entries(data)) {
            for (let i = 0; i < task["inputParameters"].length; i++) {
              if (key === task["inputParameters"][i]["name"]) {
                // 能调用
                const nodeId = parseInt(task["inputParameters"][i]["nodeId"]);
                const node = task["graph"][nodeId];
                if (node["option"] === 1) {
                  node["parameters"]["links"] = value;
                } else if (node["option"] === 4) {
                  node["parameters"]["value"] = value;
                } else if (
                  node["option"] === 8 &&
                  node["parameters"]["loopType"] === 0
                ) {
                  node["parameters"]["exitCount"] = parseInt(value);
                } else if (node["option"] === 8) {
                  node["parameters"]["textList"] = value;
                }
                break;
              }
            }
          }
          let file_names = [];
          fs.readdirSync(path.join(getDir(), "execution_instances")).forEach(
            (file) => {
              try {
                if (file.split(".")[1] == "json") {
                  file_names.push(parseInt(file.split(".")[0]));
                }
                console.log(file);
              } catch (error) {}
            }
          );
          let eid = 0;
          if (file_names.length != 0) {
            eid = Math.max(...file_names) + 1;
          }
          if (body["EID"] != "" && body["EID"] != undefined) {
            //覆盖原有的执行实例
            eid = parseInt(body["EID"]);
          }
          task["id"] = eid;
          task = JSON.stringify(task);
          fs.writeFile(
            path.join(getDir(), `execution_instances/${eid}.json`),
            task,
            (err) => {}
          );
          res.write(eid.toString(), "utf8");
          res.end();
        } else if (pathName == "/getConfig") {
          let config_file = fs.readFileSync(
            path.join(getDir(), `config.json`),
            "utf8"
          );
          config_file = JSON.parse(config_file);
          res.write(JSON.stringify(config_file));
          res.end();
        } else if (pathName == "/setUserDataFolder") {
          let config = fs.readFileSync(
            path.join(getDir(), `config.json`),
            "utf8"
          );
          config = JSON.parse(config);
          body = querystring.parse(body);
          config["user_data_folder"] = body["user_data_folder"];
          config = JSON.stringify(config);
          fs.writeFile(path.join(getDir(), `config.json`), config, (err) => {});
          res.write(
            JSON.stringify({
              success: "User data folder has been set successfully.",
            })
          );
          res.end();
        }
      });
    })
    .listen(port);
  console.log("Server has started.");
};

start();
