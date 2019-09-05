package com.odysii.selenium.helper;

import io.appium.java_client.android.AndroidDriver;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.PageFactory;

public class BasePageObject {
    protected AndroidDriver driver;
    public BasePageObject(AndroidDriver driver){
        this.driver = driver;
        PageFactory.initElements(driver,this);
    }
    protected boolean isElementPresent(WebElement element) {
        int counter = 0;
        try {
            while (!element.isDisplayed() && counter < 10){
                wait(1000);
                counter ++;
            }
        }catch (NoSuchElementException e){
            System.out.println(e.getMessage());
            return false;
        }
        if (counter == 10){
            return false;
        }
        return true;
    }
    protected void wait(int millis){
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
