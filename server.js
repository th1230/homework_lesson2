const http = require("http");
const headers = require("./headers");
const handleSuccess = require("./handleSuccess");
const handleError = require("./handleError");
const Post = require("./modals/posts");
const checkData = require("./validatorCheck");

// 連線上資料庫
require("./connection");

const requestListener = async (req, res) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  const { url, method } = req;
  // 取得所有貼文
  if (url === "/posts" && method === "GET") {
    const posts = await Post.find();
    handleSuccess(res, posts);
  }
  // 新增一則貼文
  else if (url === "/posts" && method === "POST") {
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);
        if (Array.isArray(data)) {
          for (let i = 0; i < data.length; i++) {
            checkData(data[i]);
          }
        } else {
          checkData(data);
        }

        const newPost = await Post.create(data);
        handleSuccess(res, newPost);
      } catch (error) {
        handleError(res, error);
      }
    });
  }
  // 更新一則貼文
  else if (url.startsWith("/posts/") && method === "PATCH") {
    req.on("end", async () => {
      try {
        const id = url.split("/")[2];
        if (id === undefined || id === "") {
          return handleError(res, new Error("Id未填寫"));
        }
        const data = JSON.parse(body);
        checkData(data);
        const post = await Post.findByIdAndUpdate(
          id,
          { $set: data },
          { new: true }
        );
        handleSuccess(res, post);
      } catch (error) {
        handleError(res, error);
      }
    });
  }
  // 刪除所有貼文
  else if (url === "/posts" && method === "DELETE") {
    await Post.deleteMany();
    handleSuccess(res, {
      message: "刪除成功",
    });
  }
  // 刪除一則貼文
  else if (url.startsWith("/posts/") && method === "DELETE") {
    try {
      const id = url.split("/")[2];
      if (id === undefined || id === "") {
        return handleError(res, new Error("Id未填寫"));
      }
      await Post.findByIdAndDelete(id);
      handleSuccess(res, {
        message: "刪除成功",
      });
    } catch (error) {
      handleError(res, new Error("沒有找到此Id的貼文"));
    }
  } else if (url === "/posts" && method === "OPTIONS") {
    res.writeHead(200, headers);
    res.end();
  }
  //404處理
  else {
    res.writeHead(404, headers);
    res.write(
      JSON.stringify({
        status: "false",
        message: "無此網站路由",
      })
    );
    res.end();
  }
};

const server = http.createServer(requestListener);
server.listen(process.env.PORT || 3000, () => {
  console.log("Server is running on port 3000");
});
