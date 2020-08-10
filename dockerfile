# FROM php:7.4-apache
FROM centos:latest
RUN yum -y install httpd
COPY . /var/www/html
CMD apachectl -DFOREGROUND
