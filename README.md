#SP Conf
[![Build Status](https://travis-ci.org/codeite/sp-conf.svg?branch=master)](https://travis-ci.org/codeite/sp-conf)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

SimPle CONFig

## About

A small component for reading config.
It will log all the variables your are reading so you can see what values your app it using.
It will also check where any variables are missing and allow your to respond.

## How to use

Check out example.js that shows an example of using it.

## Options common to all methods

defaultValue: The value to use if the specified value is not available

validator: A regular expressing to specify the format of the input value

## Methods available

readNumber - Read a number and complain if its not a number

readString - Read a string not applying any special rules

readPassword - Read a string but will obfuscate when logging the value out

readUrl - Read a URL and will obfuscate the password if the URL contains one.
