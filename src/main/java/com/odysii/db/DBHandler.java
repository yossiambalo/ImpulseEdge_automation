package com.odysii.db;

import com.odysii.general.PropertyLoader;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Properties;

public class DBHandler {
    private String connectionUrl;
    private String classForname;
    private Connection con;
    private Statement stmt;
    private ResultSet rs;

    public DBHandler(){
        PropertyLoader propertyLoader = new PropertyLoader();
        Properties properties = propertyLoader.loadPropFile("db.properties");
        this.connectionUrl = properties.getProperty("connection_url");
        this.classForname = properties.getProperty("class_for_name");
        connect();
    }
    private void connect(){
        try {
            Class.forName(classForname);
            con = DriverManager.getConnection(connectionUrl);
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
    }
    public ResultSet executeSelectQuery(String query) {
        String res = "";
        try {
            stmt = con.createStatement();
            rs = stmt.executeQuery(query);

        } catch (Exception e) {
            System.out.println(e.getMessage());
        } finally {
            //if (stmt != null) try { stmt.close(); } catch(Exception e) {}
            //if (rs != null) try { rs.close(); } catch(Exception e) {}
        }
        return rs;
    }
    public String executeSelectQuery(String query,int returnColumn){
        String res = "";
        try {
            stmt = con.createStatement();
            rs = stmt.executeQuery(query);

            // Iterate through the data in the result set and display it.
            while (rs.next()) {
                System.out.println(rs.getString(4) + " " + rs.getString(returnColumn));
                res = rs.getString(returnColumn);
            }
        }catch (Exception e){
            System.out.println(e.getMessage());
        }finally {
            if (stmt != null) try { stmt.close(); } catch(Exception e) {}
            if (rs != null) try { rs.close(); } catch(Exception e) {}
        }
        return res;
    }
    public void closeConnection(){
        if (con != null) try { con.close(); } catch(Exception e) {}
    }
    public void executeDeleteQuery(String query){
        try {
            stmt = con.createStatement();
            rs = stmt.executeQuery(query);

            // Iterate through the data in the result set and display it.
            while (rs.next()) {
                System.out.println(rs.getString(4) + " " + rs.getString(6));
            }
        }catch (Exception e){
            System.out.println(e.getMessage());
        }finally {
            if (stmt != null) try { stmt.close(); } catch(Exception e) {}
            if (rs != null) try { rs.close(); } catch(Exception e) {}
        }
    }
}
