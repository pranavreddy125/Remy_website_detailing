// This file contains JavaScript functions specific to the booking page, including form validation and submission handling.

document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('booking-form');
    
    bookingForm.addEventListener('submit', function(event) {
        event.preventDefault();
        if (validateForm()) {
            submitForm();
        }
    });

    function validateForm() {
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const date = document.getElementById('date').value;

        if (!name || !email || !date) {
            alert('Please fill in all fields.');
            return false;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            alert('Please enter a valid email address.');
            return false;
        }

        return true;
    }

    function submitForm() {
        // Here you would typically send the form data to a server
        alert('Booking submitted successfully!');
        bookingForm.reset();
    }
});