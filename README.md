# Demonstration of a reusable kpt package with jk

This shows:

 1. constructing an image that will run a jk script
 2. using that image with `kpt fn`
 3. making it into a package with `kpt pkg` and `kpt cfg`

Starting with the last:

## Using the package from elsewhere

You can `kpt pkg get` this repository to import it into a
configuration:

    kpt pkg get https://github.com/squaremo/kpt-generator-demo.git ./hello

The script `image/generate.js` takes two parameter values from the
functionConfig: `namespace` and `image`. I have added a "setter" to
the Kptfile for both of those, which you can use like this:

    kpt cfg set ./hello image helloworld:v3

then to re-run the generation step,

    kpt fn run ./hello --fn-path=./hello/fn

... and, if you were genuinely using this as a configuration, you
would do `git add ./hello; git commit`.

> **NB** You need to have built the `generate` image, since I can't be
> bothered pushing it anywhere; once you've got the package as above,
> `docker build ./hello/image -t generate` should do it.

## How it works

These sections explain how it's made, and assume the repo itself as
the working directory.

## Constructing an image

The directory `image/` contains a [`jk`](https://github.com/jkcfg/jk)
script, and a Dockerfile which builds it into a container image.

The configuration refers to an image called `generate`; to build the
image locally (it's not pushed anywhere):

    docker build ./image -t generate

The script itself is simple: it takes the
[`functionConfig`][kpt-fn-spec] from the input, and uses its values to
construct a deployment and a service. It ignores the rest of the
input.

### Using the image with `kpt fn`

To run the image with `kpt fn`, you need some kind of input (since
`kpt fn run` will just exit if there's no file or stdin input). The
files in `instance/` are the result of running the script with the
config in `fn/configmap_generate.yaml`; i.e.,

    kpt fn run --fn-path=./fn ./instance

Run like this, the files output should be the same as those already
there. You could also run

    kpt fn run --image=generate ./instance

to get the same result.

[kpt-fn-spec]: https://github.com/kubernetes-sigs/kustomize/blob/master/cmd/config/docs/api-conventions/functions-spec.md

### Parameterising the generated output

Since the files in instance/ are generated by the image, I don't want
to target them with setters, but rather the input to the generation;
i.e., the functionConfig in `fn/`.

To add a setter for `namespace`, say, in theory you would do this:

    kpt cfg create-setter . namespace --field data.namespace default

.. which is supposed to target just the fields with that partial path,
`data.namespace` (i.e., that in `fn/configmap_generate.yaml`); but, it
appears to target anything with the value given, regardless of the
path, and ends up being applied to the files in instance/ -- not what
I want.

I worked around this by giving it a different value in the files I
didn't want it to target, then running the `kpt cfg` command, then
regenerating the files.
