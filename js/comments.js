export function initComments() {
  // Show/hide comments toggle
  let showHideBtn = document.querySelector(".show-hide");
  let commentWrapper = document.querySelector(".comment-wrapper");

  if(!showHideBtn || !commentWrapper) return;

  showHideBtn.addEventListener('click', function () {
    if(!commentWrapper) return;

    if (commentWrapper.classList.contains('hidden')) {
      showHideBtn.textContent = "Hide comments";
      commentWrapper.classList.remove('hidden');
      commentWrapper.classList.add('visible');
      //commentWrapper.style.display = "block";
    } else {
      showHideBtn.textContent = "Show comments";
      commentWrapper.classList.remove('visible');
      commentWrapper.classList.add('hidden');
    }
  });

  // Comment form stuff
  let form = document.querySelector(".comment-form");
  let nameField = document.querySelector("#name");
  let commentField = document.querySelector("#comment");
  let list = document.querySelector(".comment-container");

  if(!form || !nameField || !commentField || !list) return;

  form.onsubmit = function (e) {
    e.preventDefault();
    if(!nameField || !commentField || !list) return;

        let nameValue = nameField.value;
    let commentValue = commentField.value;

    if (nameValue.trim().length === 0 || commentValue.trim().length === 0) {
      window.alert("Error: Name and Comment can't be empty")
        return;
    }

    let listItem = document.createElement("li");
    let namePara = document.createElement("p");
    let commentPara = document.createElement("p");


    namePara.textContent = nameValue;
    commentPara.textContent = commentValue;

    list.appendChild(listItem);
    listItem.appendChild(namePara);
    listItem.appendChild(commentPara);

    nameField.value = "";
    commentField.value = "";
  };
}
