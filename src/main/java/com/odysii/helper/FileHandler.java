package com.odysii.helper;

import java.io.File;

public class FileHandler {
    public String getFile(String fileName){

        File file = new File(getClass().getClassLoader().getResource(fileName).getFile());

        return file.toString();
    }
    public boolean isFileExist(String filePath){
        File f = new File(filePath);
        return (f.exists() && !f.isDirectory());
    }
    public boolean deleteFile(String filePath){
        File f = new File(filePath);
        return f.delete();
    }

    public void deleteFolderContent(File folder) {
        File[] files = folder.listFiles();
        if(files!=null) { //some JVMs return null for empty dirs
            for(File f: files) {
                if(f.isDirectory()) {
                    deleteFolderContent(f);
                } else {
                    f.delete();
                }
            }
        }
    }
    public File getRandomFileFromDir(File folder) {
        File[] files = folder.listFiles();
        File res = null;
        if (files != null) { //some JVMs return null for empty dirs
            for (File f : files) {
                if (!f.isDirectory()) {
                    res = f;
                }
            }
        }
        return res;
    }
}

