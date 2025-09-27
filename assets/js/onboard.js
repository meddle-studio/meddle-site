
$("#bao-patriotActNotice").click(function(e) {
  e.preventDefault();
  var patriotact = $("#patriodActNotice");
  patriotact.addClass("d-block");
  patriotact.removeClass("d-none");
});
function closePAForm() {
  document.getElementById("patriodActNotice").classList.remove("d-block");
  document.getElementById("patriodActNotice").classList.add("d-none");
}

$(".product-card select").change(function () {
  var btn = $(".tabBottom .crm_button_border");
  var slct = $('.product-card select option:selected').val();
  var lnk = "https://onboard.hustlfinancial.com/#/intake/object/rao?field%5Bstep%5D=1&field%5Breferral%5D=";
  switch(slct) {
    case "Pick one":
      btn.attr('tabindex', '-1');
      btn.attr('aria-disabled', 'true');
      btn.prop('disabled', true);
      btn.addClass("disabled");
      btn.removeAttr('href');
      $("[data-field-id='continueButton']").addClass("disabled_clickable");
      break;
    case "basin":
      btn.removeClass('disabled');
      btn.prop('disabled', false);
      btn.attr('tabindex', '1');
      btn.attr('aria-disabled', 'false');
      $("[data-field-id='continueButton']").removeClass("disabled_clickable");
      btn.attr('href', lnk + 'BASIN');
      break;
    case "cochise":
      btn.removeClass('disabled');
      btn.prop('disabled', false);
      btn.attr('tabindex', '1');
      btn.attr('aria-disabled', 'false');
      $("[data-field-id='continueButton']").removeClass("disabled_clickable");
      btn.attr('href', lnk + 'COCHISE');
      break;
    case "gila":
      btn.removeClass('disabled');
      btn.prop('disabled', false);
      btn.attr('tabindex', '1');
      btn.attr('aria-disabled', 'false');
      $("[data-field-id='continueButton']").removeClass("disabled_clickable");
      btn.attr('href', lnk + 'GILA');
      break;
    case "maricopa":
      btn.removeClass('disabled');
      btn.prop('disabled', false);
      btn.attr('tabindex', '1');
      btn.attr('aria-disabled', 'false');
      $("[data-field-id='continueButton']").removeClass("disabled_clickable");
      btn.attr('href', lnk + 'MARICOPA');
      break;
    case "pima":
      btn.removeClass('disabled');
      btn.prop('disabled', false);
      btn.attr('tabindex', '1');
      btn.attr('aria-disabled', 'false');
      $("[data-field-id='continueButton']").removeClass("disabled_clickable");
      btn.attr('href', lnk + 'PIMA');
      break;
    case "pinal":
      btn.removeClass('disabled');
      btn.prop('disabled', false);
      btn.attr('tabindex', '1');
      btn.attr('aria-disabled', 'false');
      $("[data-field-id='continueButton']").removeClass("disabled_clickable");
      btn.attr('href', lnk + 'PINAL');
      break;
    case "family":
      btn.removeClass('disabled');
      btn.prop('disabled', false);
      btn.attr('tabindex', '1');
      btn.attr('aria-disabled', 'false');
      $("[data-field-id='continueButton']").removeClass("disabled_clickable");
      btn.attr('href', lnk + 'FAMILY');
      break;
    default:
      btn.attr('tabindex', '-1');
      btn.attr('aria-disabled', 'true');
      btn.prop('disabled', true);
      btn.addClass("disabled");
      btn.removeAttr('href');
      $("[data-field-id='continueButton']").addClass("disabled_clickable");
  }
});
