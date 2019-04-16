package com.odysii.general.fileUtil;

import org.apache.commons.io.FileUtils;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class FileHandler {

    public static boolean deleteFile(String deleteFile){
        boolean flag = false;
        try{

            File file = new File(deleteFile);

            if (file.exists()){
                if(file.delete()){
                    System.out.println(file.getName() + " is deleted!");
                    flag = true;
                }else{
                    System.out.println("Delete operation is failed.");
                }
            }

        }catch(Exception e){
            System.out.println(e.getMessage());
        }
        return flag;
    }

    public static boolean copyFile(String source, String destination,boolean override){

        InputStream inStream = null;
        OutputStream outStream = null;
        boolean flag = false;

        try{

            File from = new File(source);
            File to = new File(destination);

            if (!to.exists() || override) {
                inStream = new FileInputStream(from);
                outStream = new FileOutputStream(to);

                byte[] buffer = new byte[1024];

                int length;
                //copy the file content in bytes
                while ((length = inStream.read(buffer)) > 0) {
                    outStream.write(buffer, 0, length);
                }

                inStream.close();
                outStream.close();

                System.out.println("File is copied successful!");
                flag = true;
            }

        }catch(IOException e){
            System.out.println(e.getMessage());
        }
        return flag;
    }
    public static boolean compareFiles(String file1, String file2){
        BufferedReader reader1 = null;
        BufferedReader reader2 = null;
        String line1 = "" , line2 = "";
        boolean areEqual = true;
        try {
            reader1 = new BufferedReader(new FileReader(file1));
            reader2 = new BufferedReader(new FileReader(file2));
            line1 = reader1.readLine();
            line2 = reader2.readLine();

            int lineNum = 1;

            while (line1 != null || line2 != null)
            {
                if(line1 == null || line2 == null)
                {
                    areEqual = false;

                    break;
                }
                else if(!line1.equalsIgnoreCase(line2))
                {
                    areEqual = false;

                    break;
                }

                line1 = reader1.readLine();

                line2 = reader2.readLine();

                lineNum++;
            }
        }catch (IOException e){
            e.fillInStackTrace();
        }

        if(areEqual)
        {
            return true;
        }
        else
        {
            return false;
        }

    }
    public static void deleteContentOfFolder(File folder,boolean includeFolder) {
        File[] files = folder.listFiles();
        if(files!=null) { //some JVMs return null for empty dirs
            for(File f: files) {
                if(f.isDirectory()) {
                    deleteContentOfFolder(f,true);
                } else {
                    f.delete();
                }
            }
        }
        if (includeFolder)
            folder.delete();
    }
    public static boolean isFileExist(String file){
        File file1 = new File(file);
        return file1.exists();
    }
    public static File[] getFilesOfFolder(String folder){
        File file = new File(folder);
        return file.listFiles();
    }

    public static void renameFile(File oldName,String newName){
        Path old = Paths.get(oldName.toString());
        try {
            Files.move(old, old.resolveSibling(newName));
        } catch (IOException e) {
            System.out.println(e.getMessage());
        }
    }
    public static File getFileByType(String folder, String type){
        File resFile = null;
        File[]files = FileHandler.getFilesOfFolder(folder);
        for (File file : files) {
            String fileStr = file.toString();
            if (fileStr.contains(type)) {
                resFile = file;
            }
        }
        return resFile;
    }

    public static String getFileName(String file){
        String[]arr = file.split("\\\\");
        int index = arr.length -1;
        String[]arr2 = arr[index].split("\\.");
        return  arr2[0];
    }
    public static void copyDir(String source,String destination){
        //String source = "C:/your/source";
        File srcDir = new File(source);

        //String destination = "C:/your/destination";
        File destDir = new File(destination);

        try {
            FileUtils.copyDirectory(srcDir, destDir);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
    public static void cleanDirectory(String dir){
        File fileDir = new File(dir);
        try {
            FileUtils.cleanDirectory(fileDir);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
