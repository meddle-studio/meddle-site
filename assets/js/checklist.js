jQuery(document).ready(function($) {
    let boxes = $('input:checkbox').length;

  function save() {
    for(let i = 1; i <= boxes; i++){
      var checkbox = document.getElementById(String(i));
      localStorage.setItem("checkbox" + String(i), checkbox.checked);
    }
  }

  for(let i = 1; i <= boxes; i++){
    if(localStorage.length > 0){
      var checked = JSON.parse(localStorage.getItem("checkbox" + String(i)));
      document.getElementById(String(i)).checked = checked;
    }
  }

  window.addEventListener('change', save);
});
