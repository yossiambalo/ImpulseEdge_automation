package com.odysii;

import io.appium.java_client.android.AndroidDriver;
import org.openqa.selenium.By;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.annotations.Test;

import java.net.MalformedURLException;
import java.net.URL;

public class ImpulseEdgeTest extends TestBase {

    @Test
    public void openEdge(){
        DesiredCapabilities caps = new DesiredCapabilities();
        //caps.setCapability("deviceName", "Lenovo TAB 10.1 API 24");
        caps.setCapability("deviceName", deviceName);
        caps.setCapability("uuid", "emulator-5554");
        caps.setCapability("platformName", "Android");
        caps.setCapability("platformVersion", platformVersion);
        caps.setCapability("skipUnlock","false");
        caps.setCapability("appPackage", "com.gilbarco.impulseedge");
        caps.setCapability("appActivity","com.gilbarco.impulseedge.MainActivity");
        caps.setCapability("noReset","false");
        try {
            driver = new AndroidDriver(new URL(appiumServiceUrl), caps);
        } catch (MalformedURLException e) {
            e.printStackTrace();
        }
        wait = new WebDriverWait(driver, 10);

        driver.findElement(By.id("com.gilbarco.impulseedge:id/settings_button")).click();
        driver.findElement(By.id("com.gilbarco.impulseedge:id/done_button")).click();
        driver.findElement(By.id("com.gilbarco.impulseedge:id/start_impulse_button")).click();
    }
}
