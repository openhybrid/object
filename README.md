Overview
========

This page of notes outlines how to use a Mac OS X system to prepare an Arduino Yún linux image that turns
the Arduino into a HybridObject.


How to install on an Arduino Yún
================================

1. Plug the SD card into the Arduino Yún and power it on

2. On your computer, connect to the Arduino's WiFi network, named similar to "Arduino Yun-XXXXXXXX."
Using a web browser, navigate to *http://arduino.local* and enter password *arduino* when prompted.

3. Give the board a name and enter the WiFi settings for your network.

4. Expand the Yún's available space by moving the root filesystem to the SD card.
See [How to expand the Yún disk space](https://www.arduino.cc/en/Tutorial/ExpandingYunDiskSpace).
When using a 4 GB SD card, choose 1000 MB for the size of the data partition.

After expansion is complete:

5. Upload any other sketch to remove the update sketch.

6. On your Mac OS X computer install [osxfuse](https://osxfuse.github.io/).  This provides `sshfs` 
capability which we'll use later to conveniently mount a folder on the Yún to your computer.

7. Connect to the Yún via: `ssh root@objectname.local`

   Example for getting to the right folder:

````
    root@so1:~# cd ..
    root@so1:/# cd mnt/sda1/
````


8. Update the software on the Yún and install the sftp server and node packages:

````
    opkg update
    opkg install openssh-sftp-server node node-socket.io node-socket.io-client node-serialport
````

9. Create a folder with the name "mountpoint"

````
    mkdir ~/mountpoint
````

10. Mount the arduino's filesystem to your local mountpoint:

````
    sshfs root@objectname.local:/mnt/sda1/arduino ~/mountpoint
````

   (To unmount: `umount ~/mountpoint`)

11. Work in the mounted folder and run your programms via the terminal.

12. To allow logins over the serial port on the Hybrid Object, uncomment in `/etc/inittab`:

````
    #ttyATH0::askfirst:/bin/ash --login
````

13. Setup a swap file as described below in section **SWAP**.

14. copy the arduino code to the sda1 SD card.

15. Install the dependences:

````
    npm install
````

 
reboot 


Rename Host
===========

````
    uci set system.@system[0].hostname=obj
    uci commit system
````


Clone Yún to SD card
====================

````
    umount /overlay
    dd if=/dev/mtd7ro of=/mnt/sda1/hybrid-squashfs-sysupgrade.bin
````

If you plan to disconnect power and remove the SD card, run these additional commands:

````
    sync
    halt
````


Setup a TFTP server on your Mac
===============================

Start the TFTP service on your Mac:

````
    sudo launchctl load -F /System/Library/LaunchDaemons/tftp.plist
    sudo launchctl start com.apple.tftpd
````

Download the [Arduino Yún base images zip file from Arduino.cc](http://arduino.cc/download_handler.php?f=/openwrtyun/1/YunImage_v1.5.3.zip)
and extract the three files (uboot, kernel, rootfs) from the archive.

Move the unpacked base images files into the `/private/tftpboot/` folder.


Reflashing U-Boot
-----------------

````
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
````

For more information refer to [Reflashing the OpenWrt-Yún image on the Yún](https://www.arduino.cc/en/Tutorial/YunUBootReflash).
 
 
Make node app run on startup
-----------------------------
 
TODO: <need to be filled with content>
Evaluate https://github.com/chovy/node-startup


SWAP
====
<!-- Cribbed from http://www.element14.com/community/groups/arduino/blog/2014/12/19/part-x3-arduino-yun-extending-the-ram -->
A swap file is a special kind of file that can be used as *virtual memory* by a computer's operating system.
This allows the computer's operating system to push infrequently used items from RAM to the hard disk
so that new items can use the newly freed space in the actual RAM.

#### Verifying Free Memory
 
Connect to Yún using ssh  (i.e. by running "ssh root@youryun.local” from terminal). Then run `free -m`.
This shows your current memory memory usage in **m**egabytes, including free memory.  For example:

````
             total         used         free       shared      buffers
Mem:         61116        43556        17560            0         9612
-/+ buffers:              33944        27172
Swap:            0            0            0
````

Note that the swap space shows **0**, indicating that there is no swap configured and available.
After confirming the lack of swap, you can setup a file to use for swap space.
 
#### Step 1: Create an empty file to act as a swap file
 
While connected to the Yún through the ssh terminal, run the following command to create a 
512 MB swap file named yunswapfile in folder "/swap" filled with zeroes:

    dd if=/dev/zero of=/swap/yunswapfile bs=1M count=512
 
This should run for a bit and provide output like this:

````
512+0 records in
512+0 records out
````

#### Step 2: Designate the file as a swap file

The step above just created an empty file. To make sure it can be used as a swap file, run this from the shell:

    mkswap /swap/yunswapfile
 
You should get output like this:

````
Setting up swapspace version 1, size = 524284 KiB
no label, UUID=e3e63fad-e6f7-4d4e-a32a-a326bbe48e8c
````

#### Step 3: Load the swap file for verifying

To verify that the swap file is good, try to load it by running this:

    swapon /swap/yunswapfile
 
This will not provide any output if everything is cool. So verify by checking free memory.

    free -m

This shows:
 
````
             total         used         free       shared      buffers
Mem:         61116        28644        32472            0         4888
-/+ buffers:              23756        37360
Swap:       524284            0       524284
````
 
Viola!!! Notice that swap space is now available for use by the RAM.  We're not done yet, we must instruct
the system to use this file for swap on boot, as show in step 4.
 
#### Step 4: Load the swap file as part of boot sequence
 
If you stop with Step 3, next time when you restart your Yún (linux part... either through power off/on or 
the Linux reset button near the LEDs) the swap file will not have been loaded. So to make sure that it gets 
loaded every time, you need to set the swap file as part of boot sequence.
 
**Warning:** The steps are fairly simple, but if the steps are not executed fully you might leave an inconsistent
boot config and the Linux part of the Yún may not load properly.  Don't worry, since this is Arduino you can reset
the whole thing easily and try again.  So please execute the following cleanly after understanding them.

These commands are meant to be run as **root** on your Yún.  Lines beginning with `#` are interpreted as comments
by the shell and are not interpreted, so they won't hurt anything if included via copy/paste:

````
#1. Add swap config entry to fstab
uci add fstab swap

#2. Set device config entry to swap.  Make sure you provide your full swap file name
uci set fstab.@swap[0].device=/swap/yunswapfile

#3. Enable swap
uci set fstab.@swap[0].enabled=1

#4. Set file system type as "swap"
uci set fstab.@swap[0].fstype=swap

#5. set swap options to default
uci set fstab.@swap[0].options=default

#6. set fsck to 0
uci set fstab.@swap[0].enabled_fsck=0
 
#7. Commit the config changes. If you don't run commit, the config changes will not be saved.
uci commit
````

That's it. Restart the Linux part of Yún (reset button near LEDs). After reboot, if you run 
`free -m` you should see the swap file loaded. You have successfully expanded the RAM on your 
Arduino Yún's Linux side.


How to install on a Raspberry Pi
================================

1. Use [NOOBS](https://www.raspberrypi.org/downloads/noobs/) to install the base Raspian image.

2. Update the system software.
    ````
    sudo apt-get update
    sudo apt-get upgrade -y
    ````

3. Remove the default nodejs instance and replace it with v0.12 or higher.
    ````
    sudo apt-get remove nodejs
    curl -sLS https://apt.adafruit.com/add | sudo bash
    sudo apt-get install -y node
    ````

4. Get the latest OpenHybrid Object code and download dependencies.
    ````
    git clone https://github.com/openhybrid/object.git
    cd object
    npm install
    ````

5. Run the OpenHybrid Object code.
    ````
    node server.js
    ````

A this point, you should be able to navigate to port 8080 on your device and find the Object dashboard.


