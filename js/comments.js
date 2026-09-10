export function initComments() {
  // Show/hide comments toggle
  var showHideBtn = document.querySelector(".show-hide");
  var commentWrapper = document.querySelector(".comment-wrapper");
  var commentHidden = true;

  commentWrapper.style.display = "none";

  showHideBtn.onclick = function () {
    if (commentHidden) {
      showHideBtn.textContent = "Hide comments";
      commentWrapper.style.display = "block";
    } else {
      showHideBtn.textContent = "Show comments";
      commentWrapper.style.display = "none";
    }
    commentHidden = !commentHidden;
  };

  // Comment form stuff
  var form = document.querySelector(".comment-form");
  var nameField = document.querySelector("#name");
  var commentField = document.querySelector("#comment");
  var list = document.querySelector(".comment-container");

  form.onsubmit = function (e) {
    e.preventDefault();

        var nameValue = nameField.value;
    var commentValue = commentField.value;

    if (nameValue.length == 0 || commentValue.length == 0) {
        return;
    }

    var listItem = document.createElement("li");
    var namePara = document.createElement("p");
    var commentPara = document.createElement("p");


    namePara.textContent = nameValue;
    commentPara.textContent = commentValue;

    console.log(nameValue);

    list.appendChild(listItem);
    listItem.appendChild(namePara);
    listItem.appendChild(commentPara);

    nameField.value = "";
    commentField.value = "";
  };
}
