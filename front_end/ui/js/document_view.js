$(document).ready(function() {
  var url = decodeURIComponent(getUrlParameter('docUrl'));
  var docID = getUrlParameter('docID');
  var arr = [ 'jpg', 'png', 'gif' ];

//  console.log('https://view.officeapps.live.com/op/embed.aspx?src=' + url);
  //use microsoft viewer 
  //$('#doc-frame').attr('src', 'https://view.officeapps.live.com/op/embed.aspx?src=' + url);

  $('#doc-frame').attr('src', 'https://docs.google.com/gview?url=' + url + '&embedded=true');

  for (var i = 0; i < arr.length; i++) {
    if (url.includes(arr[i])) {
      $('#image-container').attr('src', url);
      $('#image-container').show();

      $('#doc-frame').hide()

      console.log('image');

      break;  
    } 
  }

  //use google doc viewer
  $('#doc-name').text(getUrlParameter('docName'));

    $("#input-id").rating();

    
  setNewPostDocumentListener(docID); 
  setComments(docID);
});

function setNewPostDocumentListener(docID) {
  $('#docCommentModal').on('show.bs.modal', function (e) {
    if (document.cookie == '') {
      location.href = globalUrl + '/login.html' + '?redirect=' + location.href;
    }
  })
  $('#postBttn').click(function () {
    var commentBody = $('#comment-body').val();
    var userID = getUserID();
    var postBttn = $('#postBttn');
    console.log('\nuserid: ' + userID + '\ndocid :' + docID + '\nbody: ' + commentBody);

    postBttn.prop('disabled', true);
    postBttn.text('Submitting...');

    $.ajax({
      type: 'POST',
      url: globalUrl + 'postDocumentComment/?documentid=' + docID,
      data: { 
        'text': commentBody,
      },
      dataType: "html",
      //contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
      success: function(data) {
        console.log(data);
        postBttn.prop('disabled', false);
        postBttn.text('Post Comment');

        location.reload();
      },
      error: function(xhr, status, error) {
        var err = eval("(" + xhr.responseText + ")");
        console.log(err.Message);
        postBttn.prop('disabled', false);
        postBttn.text('Post Comment');
        alert('Could not contact server :O');


      }
    });
  });
}


function setComments(docID) {
  $.ajax({
    type: "GET",
    url: globalUrl + 'getDocumentComment/?documentid=' + docID,
    dataType: "html",
    success: function(data) {
      //console.log(data);
      var jsonData = $.parseJSON(data);
      console.log(jsonData);
      for (var i = 0; i < jsonData.length; i++) {
        console.log(jsonData[i].comments_text);
        var $div = $('#comment0');
        var id = jsonData[i].comments_unique_id;
        console.log(id);
        var num = parseInt( $div.prop("id").match(/\d+/g), 10 ) + id;
        var $comment = $div.clone().prop('id', 'comment'+num );
        var qid = $comment.attr('id');
        console.log(qid);

        $comment.find('p').text(jsonData[i].comments_text);



        $('#comments-row').append($comment);
        //setcommentsOnClick(qid);
        $comment.show();
      }

    },
    error: function(data) {
      console.log(data.error.message);

    }
  });

}

