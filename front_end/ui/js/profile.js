var userID;
var dataGlobalUser;
var cookieField = document.cookie.split("; ");

function submitChange(form){
  if(checkAllInputs()){
    var theUrl = globalUrl + "editUserInfo";
    //var theUrl = "http://openalexandria.us.to/loginUser";
    var formData = $(form).serializeArray();
    console.log(formData);
    $.post(theUrl, formData, function (data) {
        console.log("Profile information changed!");
        $("#log").html("<p color='black'>Profile information changed!</p>");
      }).done(function(){
        //document.cookie;

      }).fail(function (){
          $("#log").html("<p>Changes failed to save</p>");
      });
      return false;
  }
  return false;
}

hashCode = function(s){
    return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
}

function hasCode(raw){
  var hash = 0, i, chr;
    if (raw.length === 0) return hash;
      for (i = 0; i < raw.length; i++) {
            chr   = raw.charCodeAt(i);
                hash  = ((hash << 5) - hash) + chr;
                    hash |= 0; // Convert to 32bit integer
                      }
        return hash;
    }

$(document).ready(function(){
  	//var theUrl = "http://localhost:3000/getCourseKeyword?query=";
  userID = getUrlParameter('userid');
  var userUrl = globalUrl +"getUserInfoFromUID/?userid=" + userID;
    //USERS
    $.get(userUrl, function (data) {
      dataGlobalUser = data;
      var hashedCode = md5(data.firstname + data.lastname + data.email + data.userid);
      $("#avatorImg").attr('src', "https://robohash.org/" + hashedCode + ".jpg");

            //$("#PersonalInfo").html("<thead><tr><th>First Name</th><th>Last Name</th><th>User Email</th><th>Admin Status</th><th>User ID</th></tr></thead>");
      console.log(dataGlobalUser);
      $("#name").html(data.firstname + ' ' + data.lastname);
      $("#type").html(data.isadmin);
      $("#email").html(data.email);
      /*
      $("#firstname").html(data.firstname);
      $("#lastname").html(data.lastname);
      $("#email").html(data.email);
      */
      /*
      for(var count = 0; count < Object.keys(dataGlobalUser.suggestions).length; count++){
        var buttonText = "";
        if(data.suggestions[count].data.users_isactive){
          buttonText = "Block User";
        }else{
          buttonText = "Unblock User";
        }
        $("#PersonalInfo").append("<tbody><tr><td>" + data.suggestions[count].data.users_firstname + "</td><td>" + data.suggestions[count].data.users_lastname + 
          "</td><td>"+ data.suggestions[count].data.users_email +"</td><td>"+ data.suggestions[count].data.users_isadmin +
          "</td><td>" + data.suggestions[count].data.users_unique_id + 
          "<td><button id='block" + count + "' type='button' onclick='blockUser(" + count + ")'>" + buttonText + "</button></td></tr></tbody>");
      }
      */
        //window.location.href = 'http://openalexandria.us.to:3000/login.html';
    }).done(function(){
      //document.cookie;

    }).fail(function (){
      console.log("fail");
    });
});
/*
function checkPassword(){
  if(document.getElementById("password").value === document.getElementById("confirm password").value){
    return true;
  }
  else{
    alert("Password does not match.");
    return false;
  }
}
*/
function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}
function validateNumber(number) {
    return /^[0-9]+$/.test(number);
}
function validateLetters(str) {
    return /^[a-zA-Z]+$/.test(str);
}
function checkAllInputs(){

  if(!validateEmail(document.getElementById("email").value)){
    alert("Invalid email");
    return false;
  }
  else if(!validateLetters(document.getElementById("firstname").value) || !validateLetters(document.getElementById("lastname").value)){
    alert("Invalid name");
    return false
  }
  else{
    return true;
  }
}
