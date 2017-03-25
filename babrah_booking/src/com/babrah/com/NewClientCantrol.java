package com.babrah.com;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import ca.on.senecac.prg556.common.Control;
import ca.on.senecac.prg556.examples.dao.AccountDAO;
import ca.on.senecac.prg556.examples.data.AccountDAOFactory;

public class NewClientCantrol implements Control  {
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	public String var;
	private String Name;
	private String password;
	private String email;
	private String ph;
	
	public String getemail() {
		return email;
	}
	public String getpassword() {
		return password;
	}
	public String getph() {
		return ph;
	}
	public String getName() {
		return Name;
	}

	public void setName(String Name) {
		this.Name = Name;
	}
	public void setpassword(String password) {
		this.password = password;
	}
	public void setemail(String email) {
		this.email = email;
	}public void setph(String ph) {
		this.ph = ph;
	}
	@Override
	public String doLogic(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		// TODO Auto-generated method stub
		if ("POST".equals(request.getMethod())) // Check for post method submission
		{
			//setName(ClientDAOFactory.getClientDAO().getName(getName()));
				
		}
				
		return null;
	}
}