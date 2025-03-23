async function signup(e) {
    try {
        e.preventDefault();
        //console.log(e.target.email.value);

        const signupDetails = {
            name: e.target.name.value,
            email: e.target.email.value,
            phonenumber: e.target.phonenumber.value,
            password: e.target.password.value
        }
        //console.log(signupDetails);
        const response = await axios.post("http://localhost:3000/user/signup", signupDetails)
        if (response.status === 201) {
            //window.location.href = "../html/login.html" //change the page on successful login
            alert("Succesfully signed up")
        } else {
            throw new Error('Failed to login')
        }
    } catch (err) {
        alert("User already exists");
        document.body.innerHTML += `<div style="color:red;">${err.message}</div>`
    }

    document.getElementById("name").value = "";
    document.getElementById("email").value = "";
    document.getElementById("phonenumber").value = "";
    document.getElementById("password").value = "";

    

}