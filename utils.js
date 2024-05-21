exports.get_config=function (){
        // 1. 定义请求的URL
        const url = 'http://127.0.0.1:8001/api/config/';

// 2. 使用fetch()方法发起GET请求
    fetch(url, {
        method: 'GET', // 请求方法为GET
        headers: {
            'Content-Type': 'application/json', // 根据实际情况设置请求头
        },
    })
        .then(response => {
            // 3. 检查服务器响应是否成功
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            // 4. 如果成功，则将响应体转换为JSON格式
            return response.json();
        })
        .then(data => {
            // 5. 处理并展示从服务器获取的数据
            console.log(data);
        })
        .catch(error => {
            // 6. 错误处理
            console.error('There has been a problem with your fetch operation:', error);
        });

};
exports.queryTasks=function (){
    // 1. 定义请求的URL
    const url = 'http://127.0.0.1:8001/api/queryTasks';
    fetch(url, {
        method: 'GET', // 请求方法为GET
        headers: {
            'Content-Type': 'application/json', // 根据实际情况设置请求头
        },
    })
        .then(response => {
            // 3. 检查服务器响应是否成功
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            // 4. 如果成功，则将响应体转换为JSON格式
            console.log(response.json())
            return response.json();
        })
        .then(data => {
            // 5. 处理并展示从服务器获取的数据
            console.log(data);
        })
        .catch(error => {
            // 6. 错误处理
            console.error('There has been a problem with your fetch operation:', error);
        });

};
async function fetchFromPythonApi(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data from Python API:', error);
        throw error; // 或者根据需要进行其他错误处理
    }
}