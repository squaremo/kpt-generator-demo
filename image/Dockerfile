FROM alpine:latest

WORKDIR /jk
COPY --from=jkcfg/kubernetes:0.6.2 /jk/modules .
ADD https://github.com/jkcfg/jk/releases/download/0.4.0/jk-linux-amd64 ./jk
RUN chmod a+x /jk/jk
COPY generate.js ./
ENTRYPOINT ["/jk/jk", "run"]
CMD ["./generate.js"]
