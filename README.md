
How to install on an Arduino Yun
========

1. Plug the sd card in to the arduino yun

2. Connect to Arduino via Arduino Wifi Hotspot 
connect to: arduino.local
parrword: arduino

2. give the board a name...
enter the wifi settings...

3. Extend the disk to sd card.
follow the instruction in YunDiskSpaceExpander.ino (arduino)
https://github.com/Fede85/YunSketches/tree/master/YunDiskSpaceExpander

in the serial monitor chose 1000 mb for the disk space with a 4gb sd card.

Once completed the Expander: 

4. Upload any other sketch to remove the update sketch.

5. on your osx computer: 
install osxfuse 

5. connect via: ssh root@objectname.local

example for getting to the right folder. 
		root@so1:~# cd ..
		root@so1:/# cd mnt/sda1/


6. on the yun install:
opkg update
opkg install openssh-sftp-server node node-socket.io node-socket.io-client node-serialport

7. Generate a folder with the name "mountpoint". 
8. use this for mounting the arduino in to the mountpoint folder like so:
		sshfs root@objectname.local:/mnt/sda1/arduino ~/mountpoint

For unmoint
		umount ~/mountpoint

9. Work in the mounted folder and run your programms via the terminal.


10. to make the serial port work with the Hybrid Object 
uncomment in /etc/inittab:
		#ttyATH0::askfirst:/bin/ash --login

11. Follow chapter SWAP

12. copy the arduino code to the sda1 sd card.

13. install the dependences:

		npm install

 
reboot 


Renmae Host
------------------

uci set system.@system[0].hostname=obj
uci commit system


Clone Yun to sd
------------------------------

	umount /overlay

	dd if=/dev/mtd7ro of=/mnt/sda1/hybrid-squashfs-sysupgrade.bin

	sync

	halt
 (if you plan to disconnect power and remove the sdcard)


prepar bootftp
------------------

Copy the firmware package from Arduino.cc

sudo launchctl load -F /System/Library/LaunchDaemons/tftp.plist
sudo launchctl start com.apple.tftpd

Move the unpacked base images files into the folder /private/tftpboot/


UBOOT reflesh
------------

setenv serverip 192.168.1.1;
setenv ipaddr 192.168.1.146;

tftp 0x80060000 openwrt-ar71xx-generic-linino-u-boot.bin;
erase 0x9f000000 +0x40000;
cp.b $fileaddr 0x9f000000 $filesize;

tftp 0x80060000 openwrt-ar71xx-generic-yun-16M-kernel.bin;
erase 0x9fEa0000 +0x140000;
cp.b $fileaddr 0x9fea0000 $filesize;

tftp 0x80060000 openwrt-ar71xx-generic-yun-16M-rootfs-squashfs.bin;
erase 0x9f050000 +0xE50000;
cp.b $fileaddr 0x9f050000 $filesize;

bootm 0x9fea0000

 
 
 Make node app run on startup
----------------------
 
<need to be filled with content>



SWAP
---------------------------------

Verifying Free Memory
 
Connect to Yun using ssh  (i.e. by running "ssh root@youryun.local” from terminal). Then run:
free -m
This should show your current Free memory.. On mine its this:
             total         used         free       shared      buffers
Mem:         61116        43556        17560            0         9612
-/+ buffers:              33944        27172
Swap:            0            0            0
Note the Swap.. Its 0.
So now that i have confirmed that there is no swap file, I tried and set that swap file up on my Yun. The process involves 4 steps.
 
Step 1: Create an empty file to act as a swap file:
 
While connected to the Yun through the ssh terminal, run: (Note that this line will create a 512 MB swap file named yunswapfile in folder "/swap"and fill it with zero
dd if=/dev/zero of=/swap/yunswapfile bs=1M count=512
 
This should run for a bit and provide output like this:
512+0 records in
512+0 records out
 
Step 2: Designate the file as a Swap file:
The step above just created an empty file. To make sure it can be used as a swap file, run this from the shell:
mkswap /swap/yunswapfile
 
You should get output like this:
Setting up swapspace version 1, size = 524284 KiB
no label, UUID=e3e63fad-e6f7-4d4e-a32a-a326bbe48e8c

Step 3: Load the swap file for verifying
To verify that the swap file is good, try to load it by running this:
swapon /swap/yunswapfile
 
This will not provide any output if everything is cool. So verify by checking free memory.
free -m
 
             total         used         free       shared      buffers
Mem:         61116        28644        32472            0         4888
-/+ buffers:              23756        37360
Swap:       524284            0       524284
 
Viola!!! Now you can notice that a swap file is available for use by the RAM. Its not finished yet. Make sure you do step 4 below.
 
Step 4: Load the swap file as part of boot sequence
 
If you stop with Step 3, next time when you restart your Yun (linux part..either through power off/on or the Linux reset button near the LEDs) the swap file will not have been loaded. So to make sure that its gets loaded every time, you need to set the swap file as part of boot sequence.
 
Warning: The steps are fairly simple. But if you the steps are not executed fully you might leave a inconsistent boot config and Linux part of Yun may not load properly. Well this is Arduino. So you can reset the whole thing easily and try again. So please execute the following cleanly after understanding them.

//1. add swap config entry to fstab
root@youryun:/# uci add fstab swap

//2. set device config entry to swap. make sure you provide your full swap file name
root@youryun:/# uci set fstab.@swap[0].device=/swap/yunswapfile
//3. set swap is enabled
root@youryun:/# uci set fstab.@swap[0].enabled=1
//4. set file system type as "swap"
root@youryun:/# uci set fstab.@swap[0].fstype=swap

//5. set options to default
root@youryun:/# uci set fstab.@swap[0].options=default

//6. set fsck to 0
root@youryun:/# uci set fstab.@swap[0].enabled_fsck=0
 
//7. Commit the config changes. if you don't run commit, the config changes will not be added. So make sure the changes are commited.
root@youryun:/# uci commit

That's it. Done. Restart the Linux part of Yun (reset button near LEDs). After reboot, if you run "free -m" you should see the Swap file loaded. You have successfully expanded the RAM on your Arduino Yun's linux side.
