const express = require("express");
const { engine } = require("express-handlebars");
const fileUpload = require("express-fileupload");
const path = require("path");
const fs = require("fs");
const app = express();
const mysql = require("mysql");

const PORT = 5000;

app.use(fileUpload());

app.use(express.static("upload"));

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

// connection pool 最初からデータベースに接続しておく
const pool = mysql.createPool({
  connectionLimit: 10,
  host: "localhost",
  user: "kusa",
  password: "root",
  database: "image_uploader_youtube",
});

app.get("/", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("MySQL接続エラー: ", err);
      return;
    }

    console.log("MySQLと接続中...(・.・)");

    //データ取得(リクエスト送る)
    connection.query("SELECT * FROM image", (err, rows) => {
      connection.release();

      //console.log(rows);

      if (!err) {
        res.render("home", { rows });
      }
    });
  });
});

app.post("/", (req, res) => {
  if (!req.files || !req.files.imageFile) {
    return res.status(400).send("何も画像がアップロードされていません");
  }

  let imageFile = req.files.imageFile;
  let uploadDir = path.join(__dirname, "upload");
  let uploadPath = path.join(uploadDir, imageFile.name);

  // アップロードディレクトリが存在しない場合に作成する
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  imageFile.mv(uploadPath, function (err) {
    if (err) {
      console.error("ファイル移動エラー: ", err);
      return res.status(500).send("ファイルアップロードに失敗しました");
    }
    //res.send("画像アップロードに成功しました");
  });

  //MySQLに画像ファイルの名前を追加して保存する
  pool.getConnection((err, connection) => {
    if (err) {
      console.error("MySQL接続エラー: ", err);
      return;
    }

    console.log("MySQLと接続中...(・.・)");

    connection.query(
      `INSERT INTO image values ("", "${imageFile.name}")`,
      (err, rows) => {
        connection.release();

        //console.log(rows);

        if (!err) {
          res.redirect("/");
        } else {
          console.log(err);
        }
      }
    );
  });
});

app.listen(PORT, () => console.log(`サーバー起動中: http://localhost:${PORT}`));
