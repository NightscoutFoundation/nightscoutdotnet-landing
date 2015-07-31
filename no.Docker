FROM ubuntu:trusty
MAINTAINER Ben West <bewest@gmail.com>

ENV DEBIAN_FRONTEND noninteractive
ENV INTERNAL_PORT=9191
ENV PORT=9595

RUN apt-get update -y
RUN apt-get install -y wget curl git -y
RUN curl -sL https://deb.nodesource.com/setup_dev | sudo bash -

RUN echo "deb http://ppa.launchpad.net/nginx/stable/ubuntu trusty main" | tee /etc/apt/sources.list.d/nginx.list
RUN echo "deb-src http://ppa.launchpad.net/nginx/stable/ubuntu trusty main" | tee /etc/apt/sources.list.d/nginx.list
RUN apt-key  adv --keyserver keyserver.ubuntu.com --recv-keys C300EE8C
RUN apt-get update
RUN apt-get install -y python python-software-properties nodejs build-essential nginx ruby
RUN npm install -g node-gyp

ADD . /app

WORKDIR /app

# "configure nginx"
# RUN erb nginx.conf.erb | tee /etc/nginx/nginx.conf
# clean things
# RUN cd /app && rm -rf node_modules
# RUN cd /app && npm cache clean
RUN cd /app && npm install
EXPOSE $INTERNAL_PORT
EXPOSE $PORT
RUN /app/setup_docker_guest.sh
# forward request and error logs to docker log collector
# RUN ln -sf /dev/stdout /var/log/nginx/access.log
# RUN ln -sf /dev/stderr /var/log/nginx/error.log

CMD /app/start_container.sh

