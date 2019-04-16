package com.odysii.api.cloudMI;

public class CloudMIUser {

    public CloudMIUser(String userEmail) {
        this.userEmail = userEmail;
    }
    public CloudMIUser(String userEmail, String projectID) {
        this.userEmail = userEmail;
        this.projectID = projectID;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public String getProjectID() {
        return projectID;
    }

    private String userEmail;
    private String projectID;
}
