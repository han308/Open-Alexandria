//
const exec = require('child_process').exec;
var promise = require('bluebird');
var path = require('path');
var mime = require('mime-types');
var options = {
  // Initialization Options
  promiseLib: promise
};
var fileOptions = {
  width: 1920,
  height: 1080
};

var connectionInfo = {
  host: 'alexdb.us.to',
  port: 5432,
  database: 'openalexandriadb',
  user: 'cs407team4',
  password: 'openalexandria'
};

var projectPath = path.normalize(path.join(__dirname, '../documents/'));

var filepreview = require('filepreview');
var pgp = require('pg-promise')(options);
var connectionString = 'postgres://alexdb.us.to:5432/openalexandriadb';
var db = pgp(connectionInfo);

var userAuth = require("../utils/userAuth");

function uploadDocuments(req, res, next){
  var token = req.cookies.token;
  if(token === undefined){
    res.status(401).json({
      status: "Error unauthorized action",
      code: -1
    });
    return;
  };
  var filename = req.query.rename;
  if(filename === undefined){
    filename = req.file.originalname;
  }
  var destFileName = req.file.filename;

  console.log("File Path:" + req.file.path);
  var filecourseid = req.query.courseid;
  var fileuserid = userAuth.getUserID(token);
  var filetype = req.query.type;
  var filedescription =req.query.description;
  if(filedescription === undefined){
    filedescription = "document";
  }

  if(filetype === undefined){
    filetype = mime.extension(req.file.mimetype);
    console.log(filetype);
    if(!filename.includes(filetype)){
      filename = filename +  '.' + filetype;
    }
  }

  var filepath = "/documents/" + destFileName;

  var dbInsert = 'insert into documents (DOCUMENTS_NAME, DOCUMENTS_LINK, DOCUMENTS_COURSES_ID, DOCUMENTS_USERS_ID, DOCUMENTS_TYPE, DOCUMENTS_DESCRIPTION, DOCUMENTS_PREVIEW) values ($1, $2, $3, $4, $5, $6, $7);';
  var previewPath = path.join(projectPath, "/" + req.file.filename + ".jpg");

  if(!filepreview.generateSync(req.file.path, previewPath)){
    console.log("error");
  } else {
    console.log("previewPath: " + previewPath);
  }

  db.none(dbInsert, [filename, filepath, filecourseid, fileuserid, filetype, filedescription, previewPath])
    .then(function(){
      res.status(200).json({
        status: "Successful file upload",
        filename: filename,
        destFileName: destFileName,
        code: 1
      });
    }).catch(function(error){
      exec('rm -rf ' + filepath + " " + previewPath, function(err, stdout, stderr){
        res.status(500).json({
          status: "Error unknown",
          error: {name: error.name, message: error.message},
          err: err,
          code: -1
        });
      });
      console.warn('err' + error);
    })
}

function searchDocument(req, res, next){
  var filename = req.query.query;

  var dbSelect = 'select * from documents where DOCUMENTS_NAME ~* $1 and DOCUMENTS_ISACTIVE = true;';

  db.any(dbSelect, [filename])
    .then(function(data){
      var commonString = [];
      for (var i = 0; i < data.length; i++){
        var documentInfo = {
          documentuniqueid: data[i].documents_unique_id,
          documentname: data[i].documents_name,
          documentlink: "https://openalex.com" + data[i].documents_link,
          documentcourse: data[i].documents_courses_id,
          documentuser: data[i].documents_users_id,
          documentdescription: data[i].documents_description,
          documenttype: data[i].documents_type,
          documentlike: data[i].documents_numlike,
          documentdislike: data[i].documents_numdislike,
          documentdatecreated: data[i].documents_datecreated
        }
        commonString.push({value:data[i].documents_name,data:documentInfo});
      }
      res.status(200).json({suggestions:commonString});
    }).catch(function(err){
      res.status(500).json({
        status: "Error unknown",
        error: {name:err.name, message: err.message},
        code: -1
      });

    });
}

function searchDocumentByCourse(req,res,next){
  var query = req.query.query;
  var course = req.query.courseid;
  var dbSelect = 'select * from documents where DOCUMENTS_NAME ~* $1 and DOCUMENTS_COURSES_ID = $2 and DOCUMENTS_ISACTIVE = true;';

  db.any(dbSelect,[query,course])
    .then(function(data){
      var commonString = [];
      for (var i = 0; i < data.length; i++){
        var documentInfo = {
          documentuniqueid: data[i].documents_unique_id,
          documentname: data[i].documents_name,
          documentlink: "https://openalex.com" + data[i].documents_link,
          documentcourse: data[i].documents_courses_id,
          documentuser: data[i].documents_users_id,
          documentdescription: data[i].documents_description,
          documenttype: data[i].documents_type,
          documentlike: data[i].documents_numlike,
          documentdislike: data[i].documents_numdislike,
          documentdatecreated: data[i].documents_datecreated
        }
        commonString.push({value:data[i].documents_name, data: documentInfo});
      } 
      res.status(200).json({suggestions:commonString});
    }).catch(function(err){
      res.status(500).json({
        status: "Error unknown",
        error: {name:err.name, message: err.message},
        code: -1
      });

    });
}

function searchDocumentByCurrentUser(req,res,next){
  var query = req.query.query;
  var user = userAuth.getUserID(req.cookies.token);
  if(!user){
    res.status(401).json({
      status: "Error authentication error",
      code: -1
    });
    return;
  }
  var dbSelect = 'select * from documents where DOCUMENTS_NAME ~* $1 and DOCUMENTS_USERS_ID = $2;';

  db.any(dbSelect,[query,user])
    .then(function(data){
      var commonString = [];
      for (var i = 0; i < data.length; i++){
        var documentInfo = {
          documentuniqueid: data[i].documents_unique_id,
          documentname: data[i].documents_name,
          documentlink: "https://openalex.com" + data[i].documents_link,
          documentcourse: data[i].documents_courses_id,
          documentuser: data[i].documents_users_id,
          documentdescription: data[i].documents_description,
          documenttype: data[i].documents_type,
          documentlike: data[i].documents_numlike,
          documentdislike: data[i].documents_numdislike,
          documentdatecreated: data[i].documents_datecreated,
          documentisactive: data[i].documents_isactive
        }
        commonString.push({value:data[i].documents_name, data: documentInfo});
      } 
      res.status(200).json({suggestions:commonString});
    }).catch(function(err){
      res.status(500).json({
        status: "Error unknown",
        error: {name:err.name, message: err.message},
        code: -1
      });
    });
}


function searchDocumentByUser(req,res,next){
  var query = req.query.query;
  var user = req.query.userid;
  var dbSelect = 'select * from documents where DOCUMENTS_NAME ~* $1 and DOCUMENTS_USERS_ID = $2 and DOCUMENTS_ISACTIVE = true;';

  db.any(dbSelect,[query,user])
    .then(function(data){
      var commonString = [];
      for (var i = 0; i < data.length; i++){
        var documentInfo = {
          documentuniqueid: data[i].documents_unique_id,
          documentname: data[i].documents_name,
          documentlink: "https://openalex.com" + data[i].documents_link,
          documentcourse: data[i].documents_courses_id,
          documentuser: data[i].documents_users_id,
          documentdescription: data[i].documents_description,
          documenttype: data[i].documents_type,
          documentlike: data[i].documents_numlike,
          documentdislike: data[i].documents_numdislike,
          documentdatecreated: data[i].documents_datecreated,
          documentisactive: data[i].documents_isactive
        }
        commonString.push({value:data[i].documents_name, data: documentInfo});
      } 
      res.status(200).json({suggestions:commonString});
    }).catch(function(err){
      res.status(500).json({
        status: "Error unknown",
        error: {name:err.name, message: err.message},
        code: -1
      });
    });
}

function searchDocumentByUserAdmin(req,res,next){
  var query = req.query.query;
  var user = req.query.userid;
  var token = req.cookies.token;
  if(!(userAuth.checkUserAlive(token) && userAuth.checkUserAdmin(token))){
    res.status(401).json({
      status: "Error Authentication Error",
      code: -1
    });
  }
  var dbSelect = 'select * from documents where DOCUMENTS_NAME ~* $1 and DOCUMENTS_USERS_ID = $2;';

  db.any(dbSelect,[query,user])
    .then(function(data){
      var commonString = [];
      for (var i = 0; i < data.length; i++){
        var documentInfo = {
          documentuniqueid: data[i].documents_unique_id,
          documentname: data[i].documents_name,
          documentlink: "https://openalex.com" + data[i].documents_link,
          documentcourse: data[i].documents_courses_id,
          documentuser: data[i].documents_users_id,
          documentdescription: data[i].documents_description,
          documenttype: data[i].documents_type,
          documentlike: data[i].documents_numlike,
          documentdislike: data[i].documents_numdislike,
          documentdatecreated: data[i].documents_datecreated,
          documentisactive: data[i].documents_isactive
        }
        commonString.push({value:data[i].documents_name, data: documentInfo});
      } 
      res.status(200).json({suggestions:commonString});
    }).catch(function(err){
      res.status(500).json({
        status: "Error unknown",
        error: {name:err.name, message: err.message},
        code: -1
      });
    });
}


function getDocument(req, res, next){
  var documentuniqueid = req.query.documentuniqueid;
  var dbSelect = 'select * from documents where DOCUMENTS_UNIQUE_ID = $1 and DOCUMENTS_ISACTIVE = true;';
  db.one(dbSelect, [documentuniqueid])
    .then(function(data){
      res.status(200).json({
        documentuniqueid: data.documents_unique_id,
        documentname: data.documents_name,
        documentlink: "https://" + req.get('host') + data.documents_link,
        documentcourse: data.documents_courses_id,
        documentuser: data.documents_users_id,
        documentdescription: data.documents_description,
        documenttype: data.documents_type,
        documentlike: data.documents_numlike,
        documentdislike: data.documents_numdislike,
        documentdatecreated: data[i].documents_datecreated
      });
    }).catch(function(err){
      res.status(500).json({
        status: "Error file not found",
        error: {name: err.name, message: err.message},
        code: -1
      });
    });
}

function disableDocument(req, res, next){
  var uniqueid = req.query.uniqueid;
  var token = req.cookies.token;
  var dbUpdate = 'update DOCUMENTS set DOCUMENTS_ISACTIVE = $1 where DOCUMENTS_UNIQUE_ID = $2;';
  var dbSelect = 'select * from DOCUMENTS where DOCUMENTS_UNIQUE_ID = $1 and DOCUMENTS_ISACTIVE = true;';

  if(userAuth.checkUserAlive(token)){
    db.one(dbSelect, [uniqueid])
      .then(function(data){
        db.none(dbUpdate, [false, uniqueid])
          .then(function(){
            res.status(200).json({
              status: "Successful course disabled",
              code: 1
            });
          }).catch(function(err){
            res.status(500).json({
              status: "Error unknown",
              error: {name: err.name, message: err.message},
              code: -1
            });
          });
      }).catch(function(err){
        res.status(404).json({
          status: "Error Unique ID not found or already disabled",
          error: {name: err.name, message: err.message},
          code: -1
        });
      });
  }else{
    res.status(401).json({
      status: "Error Authentication Error",
      code: -1
    });
  }
}

function enableDocument(req, res, next){
  var uniqueid = req.query.uniqueid;
  var token = req.cookies.token;
  var dbUpdate = 'update DOCUMENTS set DOCUMENTS_ISACTIVE = $1 where DOCUMENTS_UNIQUE_ID = $2;';
  var dbSelect = 'select * from DOCUMENTS where DOCUMENTS_UNIQUE_ID = $1 and DOCUMENTS_ISACTIVE = false;';

  if(userAuth.checkUserAlive(token)){
    db.one(dbSelect, [uniqueid])
      .then(function(data){
        db.none(dbUpdate, [true, uniqueid])
          .then(function(){
            res.status(200).json({
              status: "Successful course enabled",
              code: 1
            });
          }).catch(function(err){
            res.status(500).json({
              status: "Error unknown",
              error: {name: err.name, message: err.message},
              code: -1
            });
          });

      }).catch(function(err){
        res.status(404).json({
          status: "Error Unique ID not found or already enabled",
          error: {name: err.name, message: err.message},
          code: -1
        });
      });
  }else{
    res.status(401).json({
      status: "Error Authentication Error",
      code: -1
    });
  }

}

function searchFeedback(req, res, next){
  var userid = req.query.userid;
  var feedbacktype = req.query.feedbacktype;
  var typeid = req.query.typeid;
  console.log("userid: " + userid);
  console.log("feedbacktype: " + feedbacktype);
  console.log("typeid: " + feedbacktype);

  var dbSelect = 'select * from USERSFEEDBACK where USERSFEEDBACK_USERS_ID = $1 and USERSFEEDBACK_TYPE = $2 and USERSFEEDBACK_ITEM_ID = $3;';

  db.one(dbSelect, [userid, feedbacktype, typeid])
    .then(function(data){
      res.status(200).json({
        data
      })
    }).catch(function(err){
      res.status(500).json({
        status: "Error unknown",
        error: {name: err.name, message: err.message},
        code: -1
      });
    });
}

function likeDocument(req, res, next){
  var userid = userAuth.getUserID(req.cookies.token);
  if(!userid){
    res.status(401).json({
      status: "Error authentication error",
      code: -1
    });
    return;
  }
  var documentid = req.query.documentid;
  var dbSelect =  'select * from USERSFEEDBACK where USERSFEEDBACK_USERS_ID = $1 and USERSFEEDBACK_TYPE = 1 and USERSFEEDBACK_ITEM_ID = $2;';
  var dbInsert = 'insert into USERSFEEDBACK (USERSFEEDBACK_USERS_ID, USERSFEEDBACK_TYPE, USERSFEEDBACK_ITEM_ID, USERSFEEDBACK_ISLIKE, USERSFEEDBACK_RATING) values ($1, $2, $3, $4, $5);';
  var dbUpdate = 'update USERSFEEDBACK set USERSFEEDBACK_ISLIKE = true where USERSFEEDBACK_USERS_ID = $1 and USERSFEEDBACK_TYPE = 1 and USERSFEEDBACK_ITEM_ID= $2;';

  db.oneOrNone(dbSelect, [userid, documentid])
    .then(function(data){
      if(data == null){
        db.none(dbInsert, [userid, 1, documentid, true, -1])
          .then(function(){
            res.status(200).json({
              status: "Successful inserted",
              code: 1
            });
          }).catch(function(err){
            res.status(500).json({
              status: "Error unknown",
              error: {name: err.name, message: err.message},
              code: -1
            });
          });
      } else if(data.usersfeedback_type == 1){
        db.none(dbUpdate, [userid, documentid])
          .then(function(){
            res.status(200).json({
              status: "Successful inserted",
              code: 1
            });

          }).catch(function(err){
            res.status(500).json({
              status: "Error unknown",
              error: {name: err.name, message: err.message},
              code: -1
            });
          });
      }
    }).catch(function(err){
      res.status(500).json({
        status: "Error unknown",
        error: {name: err.name, message: err.message},
        code: -1
      });
    });
}

function dislikeDocument(req, res, next){
  var userid = userAuth.getUserID(req.cookies.token);
  if(!userid){
    res.status(401).json({
      status: "Error authentication error",
      code: -1
    });
    return;
  }
  var documentid = req.query.documentid;
  var dbSelect =  'select * from USERSFEEDBACK where USERSFEEDBACK_USERS_ID = $1 and USERSFEEDBACK_TYPE = 1 and USERSFEEDBACK_ITEM_ID = $2;';
  var dbInsert = 'insert into USERSFEEDBACK (USERSFEEDBACK_USERS_ID, USERSFEEDBACK_TYPE, USERSFEEDBACK_ITEM_ID, USERSFEEDBACK_ISLIKE, USERSFEEDBACK_RATING) values ($1, $2, $3, $4, $5);';
  var dbUpdate = 'update USERSFEEDBACK set USERSFEEDBACK_ISLIKE = false where USERSFEEDBACK_USERS_ID = $1 and USERSFEEDBACK_TYPE = 1 and USERSFEEDBACK_ITEM_ID= $2;';

  db.oneOrNone(dbSelect, [userid, documentid])
    .then(function(data){
      if(data == null){
        db.none(dbInsert, [userid, 1, documentid, false, -1])
          .then(function(){
            res.status(200).json({
              status: "Successful inserted",
              code: 1
            });
          }).catch(function(err){
            res.status(500).json({
              status: "Error unknown",
              error: {name: err.name, message: err.message},
              code: -1
            });
          });
      } else if(data.usersfeedback_type == 1){
        db.none(dbUpdate, [userid, documentid])
          .then(function(){
            res.status(200).json({
              status: "Successful inserted",
              code: 1
            });

          }).catch(function(){
            res.status(500).json({
              status: "Error unknown",
              error: {name: err.name, message: err.message},
              code: -1
            });
          });
      }
    }).catch(function(err){
      res.status(500).json({
        status: "Error unknown",
        error: {name: err.name, message: err.message},
        code: -1
      });
    });
}

function postDocumentComment(req, res, next){
  var userid = userAuth.getUserID(req.cookies.token);
  if(!userid){
    res.status(401).json({
      status: "Error authentication error",
      code: -1
    });
    return;
  }
  var documentid = req.query.documentid;
  var text = req.body.text;

  var dbInsert = 'insert into COMMENTS (COMMENTS_USERS_ID, COMMENTS_ITEM_ID, COMMENTS_TEXT) values($1, $2, $3);';

  db.none(dbInsert, [userid, documentid, text])
    .then(function(){
      res.status(200).json({
        status: "Successful Post",
        code: 1
      });
    }).catch(function(err){
      res.status(500).json({
        status: "Error unknown",
        error: {name: err.name, message: err.message},
        code: -1
      });
    });
}

function getDocumentComment(req, res, next){
  var documentid = req.query.documentid;

  var dbSelect = 'select * from COMMENTS where COMMENTS_ITEM_ID = $1';

  db.any(dbSelect, [documentid])
    .then(function(data){
      res.status(200).json(data);
    }).catch(function(err){
      res.status(500).json({
        status: "Error unknown",
        error: {name: err.name, message: err.message},
        code: -1
      });
    }); 
}

function addTag(res, tagid, documentid) {

  var dbSelectLink = 'select * from TAGLINK where TAGLINK_TAGLIST_ID = $1 and TAGLINK_DOCUMENTS_ID = $2;';
  var dbInsertLink = 'insert into TAGLINK (TAGLINK_TAGLIST_ID, TAGLINK_DOCUMENTS_ID) values ($1, $2);';
  db.oneOrNone(dbSelectLink, [tagid, documentid])
    .then(function(dSelectLink){
      if(dSelectLink == null){
        db.none(dbInsertLink, [tagid, documentid])
          .then(function(){
            res.status(200).json({
              status: "Successfully added tag to document",
              code: 1
            });
          }).catch(function(err){
            res.status(500).json({
              status: "Error unknown - 3",
              error: {name: err.name, message: err.message},
              code: -1
            });

          });
      }else{
        res.status(200).json({
          status: "tag to document already exist",
          code: 1
        });
      }
    }).catch(function(err){
      res.status(500).json({
        status: "Error unknown - 4",
        error: {name: err.name, message: err.message},
        code: -1
      });
    });

}

function addTagToDocument(req, res, next){
  var userid = userAuth.getUserID(req.cookies.token);
  if(!userid){
    res.status(401).json({
      status: "Error authentication error",
      code: -1
    });
    return;
  }

  var tag = req.query.tag;
  var documentid = req.query.documentid;
  var tagid;

  var dbSelectList = 'select * from TAGLIST where TAGLIST_TEXT = $1;';
  var dbInsertList = 'insert into TAGLIST (TAGLIST_TEXT) values ($1);';

  db.oneOrNone(dbSelectList, [tag])
    .then(function(dSelectList){
      console.log(dSelectList);
      if(dSelectList == null){
        db.none(dbInsertList, [tag])
          .then(function(){
            console.log("inserted"); 
            db.oneOrNone(dbSelectList, [tag])
              .then(function(dSelectListB){
                console.log("SelectingAgain");
                tagid = dSelectListB.taglist_unique_id;
                console.log(tagid);
                addTag(res, tagid, documentid);

              }).catch(function(err){
                res.status(500).json({
                  status: "Error unknown - 1",
                  error: {name: err.name, message: err.message},
                  code: -1
                });
              });

            console.log("Done2");
            //Good
          }).catch(function(err){
            res.status(500).json({
              status: "Error unknown - 2",
              error: {name: err.name, message: err.message},
              code: -1
            });
          });
      }else{
        tagid = dSelectList.taglist_unique_id;
        console.log(tagid);
        addTag(res, tagid, documentid);
      }

      console.log("Done: " + tagid);
      console.log("Done3");
    }).catch(function(err){
      res.status(500).json({
        status: "Error unknown - 5",
        error: {name: err.name, message: err.message},
        code: -1
      });
    });
}

function getDocumentsFromTag(req, res, next){
  var dbSelect = "SELECT * from taglink where taglink.taglink_taglist_id in ( SELECT taglist.taglist_unique_id FROM taglist where taglist_text = $1);";

  var tag = req.query.tag;

  db.any(dbSelect, [tag])
    .then(function(data){
      res.status(200).json(data);
    }).catch(function(err){
      res.status(500).json({
        status: "Error unknown",
        error: {name: err.name, message: err.message},
        code: -1
      });
    });
}

function getTagsFromDocument(req, res, next){
  var dbSelect = "SELECT * FROM taglist where taglist.taglist_unique_id in( SELECT taglink.taglink_taglist_id FROM taglink WHERE taglink_documents_id = $1);";

  var documentid = req.query.documentid;

  db.any(dbSelect, [documentid])
    .then(function(data){
      res.status(200).json(data);
    }).catch(function(err){
      res.status(500).json({
        status: "Error unknown",
        error: {name: err.name, message: err.message},
        code: -1
      });
    });
}

function addRatingToDocument(req, res, next){
  var userid = userAuth.getUserID(req.cookies.token);
  if(!userid){
    res.status(401).json({
      status: "Error authentication error",
      code: -1
    });
    return;
  }
  var rating = req.query.rating;
  var documentid = req.query.documentid;
  var dbSelect =  'select * from USERSFEEDBACK where USERSFEEDBACK_USERS_ID = $1 and USERSFEEDBACK_TYPE = 1 and USERSFEEDBACK_ITEM_ID = $2;';
  var dbInsert = 'insert into USERSFEEDBACK (USERSFEEDBACK_USERS_ID, USERSFEEDBACK_TYPE, USERSFEEDBACK_ITEM_ID, USERSFEEDBACK_RATING) values ($1, $2, $3, $4);';
  var dbUpdate = 'update USERSFEEDBACK set USERSFEEDBACK_RATING = $1 where USERSFEEDBACK_USERS_ID = $2 and USERSFEEDBACK_TYPE = 1 and USERSFEEDBACK_ITEM_ID= $3;';

  db.oneOrNone(dbSelect, [userid, documentid])
    .then(function(data){
      if(data == null){
        db.none(dbInsert, [userid, 1, documentid, rating])
          .then(function(){
            res.status(200).json({
              status: "Successful inserted",
              code: 1
            });
          }).catch(function(err){
            res.status(500).json({
              status: "Error unknown",
              error: {name: err.name, message: err.message},
              code: -1
            });
          });
      } else if(data.usersfeedback_type == 1){
        db.none(dbUpdate, [rating, userid, documentid])
          .then(function(){
            res.status(200).json({
              status: "Successful inserted",
              code: 1
            });

          }).catch(function(err){
            res.status(500).json({
              status: "Error unknown",
              error: {name: err.name, message: err.message},
              code: -1
            });
          });
      }
    }).catch(function(err){
      res.status(500).json({
        status: "Error unknown",
        error: {name: err.name, message: err.message},
        code: -1
      });
    });
}

function getDocumentRating(req, res, next){
  var documentid = req.query.documentid;

  var dbSelect = 'select sum(USERSFEEDBACK_RATING)/count(USERSFEEDBACK_RATING) as actualrating from USERSFEEDBACK where USERSFEEDBACK_ITEM_ID = $1 AND USERSFEEDBACK_TYPE = 1 group by usersfeedback_item_id;';

  db.one(dbSelect, [documentid])
    .then(function(data){
      res.status(200).json({
        status: "Successful!",
        code: 1,
        sum: data
      });
    }).catch(function(err){
      res.status(500).json({
        status: "Error unknown",
        error: {name: err.name, message: err.message},
        code: -1
      });
    });

}

module.exports = {
  uploadDocuments: uploadDocuments,
  searchDocument: searchDocument,
  searchDocumentByCourse: searchDocumentByCourse,
  searchDocumentByCurrentUser:searchDocumentByCurrentUser,
  searchDocumentByUser:searchDocumentByUser, 
  searchDocumentByUserAdmin: searchDocumentByUserAdmin,
  getDocument: getDocument,
  disableDocument: disableDocument,
  enableDocument: enableDocument,
  likeDocument: likeDocument,
  dislikeDocument: dislikeDocument,
  searchFeedback: searchFeedback, 
  postDocumentComment:postDocumentComment,
  getDocumentComment: getDocumentComment,
  addTagToDocument:addTagToDocument,
  getDocumentsFromTag: getDocumentsFromTag,
  getTagsFromDocument: getTagsFromDocument,
  addRatingToDocument:addRatingToDocument,
  getDocumentRating: getDocumentRating,
};
