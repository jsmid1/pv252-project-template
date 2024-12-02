FROM debian:bookworm-slim

WORKDIR "/root"

COPY "target/release/socket-server" "/root/server"

RUN chmod +x "/root/server"

EXPOSE 9000

CMD ["/root/server 9000"]
ENTRYPOINT ["/bin/sh", "-c"]