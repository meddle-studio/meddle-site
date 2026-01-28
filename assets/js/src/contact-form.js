// 1. CUSTOM SELECT LOGIC (Remains the same for UI)
document.querySelectorAll('.meddle-select-wrapper').forEach(wrapper => {
    const trigger = wrapper.querySelector('.meddle-select-trigger');
    const hiddenInput = wrapper.querySelector('input[type="hidden"]');

    trigger.addEventListener('click', () => {
        document.querySelectorAll('.meddle-select-wrapper').forEach(w => { if(w !== wrapper) w.classList.remove('open'); });
        wrapper.classList.toggle('open');
    });

    wrapper.querySelectorAll('.meddle-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const val = opt.getAttribute('data-value');
            trigger.innerText = opt.textContent;
            trigger.classList.add('value');
            hiddenInput.value = val;
            wrapper.classList.remove('open');
        });
    });
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.meddle-select-wrapper')) {
        document.querySelectorAll('.meddle-select-wrapper').forEach(w => w.classList.remove('open'));
    }
});

// 2. FIXED HUBSPOT API SUBMISSION
const form = document.getElementById('meddle-hubspot-form');
const submitBtn = document.getElementById('submit-btn');

if (form && submitBtn) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.innerText = "SENDING...";

        const portalId = '147536977';
        const formId = '00e8fefa-5f4e-4b3b-87e0-cb534d4c0836';
        const endpoint = `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formId}`;

        const formData = new FormData(form);

        // Parse name for CRM first/last name fields
        const full_name = formData.get('full_name') || "";
        const nameParts = full_name.trim().split(' ');

        // Extract multi-select values (checkboxes)
        const projectTypes = Array.from(formData.getAll('project_type')).join(';');

        // This payload uses the exact internal property names found in your Form.mhtml
        const data = {
            "fields": [
                { "name": "0-1/full_name", "value": full_name },
                { "name": "firstname", "value": nameParts[0] },
                { "name": "lastname", "value": nameParts.slice(1).join(' ') || ' ' },
                { "name": "0-1/email", "value": formData.get('email').trim() },
                { "name": "0-2/name", "value": formData.get('name').trim() || "" },
                { "name": "0-1/website", "value": formData.get('website').trim() || "" },
                { "name": "0-1/message", "value": formData.get('message').trim() || "" },
                { "name": "0-1/project_type", "value": projectTypes },
                { "name": "timeline", "value": formData.get('timeline') || "" },
                { "name": "budget_expectation", "value": formData.get('budget_expectation') || "" },
                { "name": "how_did_you_hear_about_us", "value": formData.get('how_did_you_hear_about_us').trim() || "" }
            ],
            "context": {
                "pageUri": window.location.href,
                "pageName": document.title
            }
        };

        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            mode: 'cors'
        }).then(res => {
            if (res.ok) {
                window.location.href = "https://calendly.com/matt-meddle/discovery-call";
            } else {
                return res.json().then(errorData => {
                    console.error("HubSpot Error:", errorData);
                    alert("Form Error: " + (errorData.errors?.[0]?.message || "Check console"));
                    submitBtn.disabled = false;
                    submitBtn.innerText = "Submit";
                });
            }
        }).catch(err => {
            console.error("Network Error:", err);
            submitBtn.disabled = false;
            submitBtn.innerText = "Submit";
        });
    });
}
