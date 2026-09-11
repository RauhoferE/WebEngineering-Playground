export function initComments() {
  // Show/hide comments toggle
  const showHideBtn = document.querySelector(".show-hide");
  const commentWrapper = document.querySelector(".comment-wrapper");

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
  const form = document.querySelector(".comment-form");
  const nameField = document.querySelector("#name");
  const commentField = document.querySelector("#comment");
  const list = document.querySelector(".comment-container");

  if(!form || !nameField || !commentField || !list) return;

  form.onsubmit = function (e) {
    e.preventDefault();
    if(!nameField || !commentField || !list) return;

        const nameValue = nameField.value;
    const commentValue = commentField.value;

    if (nameValue.trim().length === 0 || commentValue.trim().length === 0) {
      window.alert("Error: Name and Comment can't be empty")
        return;
    }

    const listItem = document.createElement("li");
    const namePara = document.createElement("p");
    const commentPara = document.createElement("p");


    namePara.textContent = nameValue;
    commentPara.textContent = commentValue;

    list.appendChild(listItem);
    listItem.appendChild(namePara);
    listItem.appendChild(commentPara);

    nameField.value = "";
    commentField.value = "";
  };
}
