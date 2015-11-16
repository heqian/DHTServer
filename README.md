DHTServer
=========

A web server app implemented with Node.js for monitoring temperature and humidity on Raspberry Pi with DHT22 sensor.


# What You Need
1. Raspberry Pi;
2. DHT22 sensor;
3. Breadboard & cables.

# Hardware Tutorial
[Click to Download](https://learn.adafruit.com/downloads/pdf/dht-humidity-sensing-on-raspberry-pi-with-gdocs-logging.pdf)

# Software Tutorial
## Install Broadcom BCM 2835
```bash
wget http://www.airspayce.com/mikem/bcm2835/bcm2835-1.46.tar.gz
tar -xvf bcm2835-1.46.tar.gz
cd bcm2835-1.46/
make
sudo make install
cd ..
rm -rf bcm2835-1.46/ bcm2835-1.46.tar.gz
```
## Setup DHTServer
```bash
git clone https://github.com/heqian/DHTServer.git
cd DHTServer/
npm install
```
## Get the Party Started!
```bash
node server.js &
```

# Example
The temperature & humidity in our Interaction Lab: [http://pi.heqian.name](http://pi.heqian.name)
![All in One](https://dl.dropboxusercontent.com/u/1660254/DHTServer.jpg)
