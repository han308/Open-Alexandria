$( document ).ready(function() {
    console.log( "ready!" );
     $('#createBttn').on('click', function(e) {  
        var courseName = $('#courseNameBox').val();
         var courseDescription = $('#courseDescrBox').val();
         var school = $('#schoolBox').val();
         
         createCourse(courseName, courseDescription, school);
    });
    
     $('#cancelBttn').on('click', function(e) {  
        
         location.href = './index.html';
    });
});

function createCourse(cn, cd, s) {
     $.ajax({
        type: "POST",
        url: 'http://Openalexandria.us.to/getCourseKeyword/',
        data: ({ coursename : cn, coursedescription: cd, school : s}),
        dataType: "html",
        success: function(data) {
            console.log(data);
        },
        error: function() {
            alert('Error occured');
        }
    });
}