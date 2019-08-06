package com.odysii;

import io.appium.java_client.android.AndroidDriver;
import io.appium.java_client.service.local.AppiumDriverLocalService;
import io.appium.java_client.service.local.AppiumServiceBuilder;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.annotations.AfterClass;
import org.testng.annotations.BeforeSuite;
import org.testng.annotations.Parameters;

import java.io.File;
import java.io.IOException;

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
        this.deviceName = deviceName;
        this.platformVersion = platformVersion;
        String emulatorPath = "emulator -avd "+deviceName;//"C:\\Users\\nir.sarusy\\AppData\\Local\\Android\\Sdk\\emulator\\emulator.exe";
        runCmd(emulatorPath);
        //AppiumServiceBuilder builder = new AppiumServiceBuilder().withAppiumJS(new File("C:\\Users\\yossi.ambalo\\AppData\Local\\Programs\\Appium\\resources\\app\\node_modules\\appium\\lib\\main.js"));
        /**
         * Original main.js location: C:\Users\yossi.ambalo\AppData\Local\Programs\Appium\resources\app\node_modules\appium\build\lib
         */
        appiumService = AppiumDriverLocalService.buildService(new AppiumServiceBuilder().withAppiumJS(new File(getFile("appium_js\\main.js"))));
        appiumService.start();
        appiumServiceUrl = appiumService.getUrl().toString();
        System.out.println("Appium Service Address : - "+ appiumServiceUrl);
    }
    private void runCmd(String command){
        try {
            Runtime.getRuntime().exec("cmd.exe /c "+command);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    @AfterClass
    public void teardown(){
        driver.quit();
        appiumService.stop();
        runCmd(KILL_EMULATOR_CMD);
    }
    protected String getFile(String fileName) {
        return System.getProperty("user.dir")+"\\src\\main\\resources\\"+fileName;
    }
}
