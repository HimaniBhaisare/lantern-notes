class Alert {
    constructor() {
        this.alertBox = document.createElement('div');
        this.alertBox.setAttribute("class", "alert");
        this.alertMessage = document.createElement('span');
        this.alertMessage.setAttribute("class", "alert-message");
        this.closeAlert = document.createElement('span');
        this.closeAlert.setAttribute("class", "close");
        this.closeAlert.innerHTML = "&times;";
        this.closeAlert.onclick = () => {
            this.alertBox.style.opacity = "0";
            setTimeout(() => this.alertBox.style.display = "none", 600);
        }
        this.alertBox.append(this.alertMessage);
        this.alertBox.append(this.closeAlert);
        this.alertBox.style.display = "none"
    }

    display(message) {
        this.alertMessage.innerHTML = message;
        document.getElementById('alertDiv').append(this.alertBox);
        this.alertBox.style.display = "block";
        setTimeout(() => {
            this.alertBox.style.opacity = "0";
            setTimeout(() => this.alertBox.style.display = "none", 600);
        }, 3000);
    }
}