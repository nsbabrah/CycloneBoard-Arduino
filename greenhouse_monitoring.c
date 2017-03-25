#include <hidef.h> /* for EnableInterrupts macro */
#include "derivative.h" /* include peripheral declarations */

#include "D:\library_de1.h"


        volatile unsigned char babrah;
        volatile unsigned char a;
        volatile unsigned char b;
        volatile unsigned char start;
       volatile unsigned long bob;


void start_button(void);// function for buttons work
void print_status(void);// function for printing staus
void room1(void);
void room2(void);
void room3(void);
void low_voltage(void);
void med_voltage(void);
void high_voltage(void);
// navjot u need to set value in HEX3 2,1,0 for high low medium value just copy paste chracter u have on lab details.
void main(void)
{

  SOPT_COPE = 0;

  devices_init();


  LCD_ROWS=4;
  // set up for 4X16 LCD display
  LCD_COLS=16;






  for(;;){
       low_voltage();
       med_voltage();
       high_voltage();
       if(SW_SW9==1)
       {
           LEDR_LED9=1;
           room1();
           room2();
           room3();
       }
       else if(SW_SW9==0)
       {
           LEDR_LED9=0;
           if(SWL & 0b0000001)

           {
               LEDRL |= 0b00000001;

           }
           else

           {
               LEDRL &= 0b11111110;

           }


           if(SWL & 0b0000010)

           {
               LEDRL |= 0b00000010;

           }
           else

                   {
                       LEDRL &= 0b11111101;
                   }
           if(SWL & 0b0000100)

               {
                   LEDRL |= 0b00000100;

               }
           else

                   {
                       LEDRL &= 0b11111011;

                   }

       }

         // delay_milli(50);


}
// c1+=c; room 1


  delay_milli(10);
}

void low_voltage(void)
{
    bob=analog_read(0);
    if(bob <= 0x20) // for low

             {
               HEX3=0b11111110;
               HEX2=0b11111111;
               HEX1=0b11100010;
               HEX0=0b11000100;
              }
    //c=1;
}
void med_voltage(void)
{
    bob=analog_read(0);
    if (bob >= 0x20 && bob <= 0x90) // for meduim
                {
                   HEX3=0b11000100;
                   HEX2=0b11111111;
                   HEX1=0b11010100;
                   HEX0=0b11110100;
    }
    //c=2;
}
void high_voltage(void)
{
    bob=analog_read(0);
     if ((bob  >= 0x90))  // for high

             {
            HEX3=0b00010000;
            HEX1=0b11010000;
            HEX2=0b11111111;
            HEX0=0b11000100;


             }
     //c=3;
}



void room1()/// room 1 function
{
    //navjot this function is working properly without dillay_milli

 int i;

                  static unsigned char buffer=0;
                       if(SW_KEY1==0)
                      {
                            LEDG_LED2=1;
                                LEDG_LED3=1;
                               LEDR_LED0=SW_SW0;
                              // buffer=0;
                               i=0;
                           }


                         if(SW_KEY1==1)
                            {


                             LEDG_LED2=0;
                             LEDG_LED3=0;

                            i++;
                           if(i==50){// this function work without delay milli

                              LEDR_LED0=0;
                           }




                          }
                       }




void room2(void){
     static unsigned char count=0;
       if(SW_KEY2==0)
          {
                LEDG_LED4=1;
                    LEDG_LED5=1;
                   LEDR_LED1=SW_SW1;
                   count=0;
               }
             if(SW_KEY2==1)
                {
                 LEDG_LED4=0;
                LEDG_LED5=0;

                count++;
                if(count==0xf0)
                    {
                LEDR_LED1=0;

              }
                }


}
void room3(void){

    static unsigned char stack=0;
       if(SW_KEY3==0)
          {
                LEDG_LED7=1;
                    LEDG_LED6=1;
                   LEDR_LED2=SW_SW2;
                   stack=0;
               }
             if(SW_KEY3==1)
                {
                 LEDG_LED7=0;
                LEDG_LED6=0;

                stack++;
                if(stack==0xf0)
                    {
                LEDR_LED2=0;

              }
                }
}
