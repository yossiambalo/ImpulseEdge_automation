package com.odysii;

import io.appium.java_client.android.AndroidDriver;
import io.appium.java_client.service.local.AppiumDriverLocalService;
import io.appium.java_client.service.local.AppiumServiceBuilder;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.BeforeSuite;
import org.testng.annotations.Parameters;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.List;
import java.util.concurrent.TimeUnit;

public class TestBase {

    protected String deviceName, platformVersion;
    protected AndroidDriver driver;
    protected WebDriverWait wait;
    AppiumDriverLocalService appiumService;
    String appiumServiceUrl;
    public final String KILL_EMULATOR_CMD = "adb -s emulator-5554 emu kill";
    @Parameters({"deviceName","platformVersion"})
    @BeforeSuite
    public void init(String deviceName,String platformVersion){
        int timeOut = 0;
        this.deviceName = deviceName;
        this.platformVersion = platformVersion;
        String runEmulatorCmd = "emulator -avd "+deviceName;//"C:\\Users\\nir.sarusy\\AppData\\Local\\Android\\Sdk\\emulator\\emulator.exe";
        String checkEmulatorStatus = "adb devices";
        runCmd(runEmulatorCmd,false);
        while (!runCmd(checkEmulatorStatus,true) && timeOut < 10){
            wait(5000);
            timeOut++;
        }
        /**
         * Original main.js location: C:\Users\yossi.ambalo\AppData\Local\Programs\Appium\resources\app\node_modules\appium\build\lib
         */
        //appiumService = AppiumDriverLocalService.buildService(new AppiumServiceBuilder().withAppiumJS(new File(getFile("appium_js\\main.js"))));
        appiumService = AppiumDriverLocalService.buildService(new AppiumServiceBuilder().withAppiumJS(new File(System.getProperty("user.home")+"\\AppData\\Local\\Programs\\Appium\\resources\\app\\node_modules\\appium\\build\\lib\\main.js")));
        appiumService.start();
        appiumServiceUrl = appiumService.getUrl().toString();
    }
    @BeforeClass
    protected void loadEmulator(){
        int timeOut = 0;
        DesiredCapabilities caps = new DesiredCapabilities();
        //caps.setCapability("deviceName", "Lenovo TAB 10.1 API 24");
        caps.setCapability("deviceName", deviceName);
        caps.setCapability("uuid", "emulator-5554");
        caps.setCapability("platformName", "Android");
        caps.setCapability("platformVersion", platformVersion);
        caps.setCapability("skipUnlock","false");
        caps.setCapability("appPackage", "com.gilbarco.impulseedge.debug");
        caps.setCapability("appActivity","com.gilbarco.impulseedge.MainActivity");
        caps.setCapability("noReset","true");
        caps.setCapability("automationName","UiAutomator2");
        caps.setCapability("avdReadyTimeout",300000);
        caps.setCapability("avdLaunchTimeout",300000);
        caps.setCapability("appWaitDuration",300000);
        while (!getDriver(caps) && timeOut < 10){
            wait(5000);
            timeOut++;
        }
        if (timeOut == 10){
            try {
                throw new Exception("Failed to load emulator!");
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
    private boolean runCmd(String command , boolean getOutPut){
        boolean res = false;
        try {
            java.util.Scanner s = new java.util.Scanner(Runtime.getRuntime().exec(command).getInputStream()).useDelimiter("\\A");
         if (getOutPut){
             //return s.hasNext() ? s.next() : "";
            res = s.next().contains("emulator-5554");
         }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return res;
    }
    @AfterClass
    public void teardown(){
        driver.quit();
        appiumService.stop();
        runCmd(KILL_EMULATOR_CMD,false);
    }
    protected String getFile(String fileName) {
        return System.getProperty("user.dir")+"\\src\\main\\resources\\"+fileName;
    }
    public void wait(int timeOut){
        try {
            Thread.sleep(timeOut);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
    private boolean getDriver(DesiredCapabilities caps){
        boolean res = true;
        try {
            driver = new AndroidDriver(new URL(appiumServiceUrl), caps);
            driver.manage().timeouts().implicitlyWait(20, TimeUnit.SECONDS);
        } catch (Exception e) {
            res = false;
        }
        return res;
    }
    protected boolean isElementPresent(By by){
        return driver.findElements(by).size() > 0;
    }
}
