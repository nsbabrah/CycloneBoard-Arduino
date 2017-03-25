package com.babrah.com;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import ca.on.senecac.prg556.common.Control;

public class ClientLoginCantrol implements Control {
	private String username;
	private String password;
	
	public String getusername() {
		return  username;
	}

	public void setusername( String username) {
		this. username =  username;
	}
	public String getpasswod() {
		return  username;
	}

	public void setpassword(String password) {
		this.password =  password;
	}
	@Override
	public String doLogic(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		// TODO Auto-generated method stub
		if ("POST".equals(request.getMethod())) // Check for post method submission
		{
			
				
		}
		
		return null;
	}

}
