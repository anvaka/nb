# Neighborhood beautification

This code implements [Neighborhood beautification](https://ccl.northwestern.edu/2018/galan2018.pdf) 
graph layout algorithm proposed by Severino F. Galán and Ole J. Mengshoel.

I extended it by adding a new step that pushes nodes away from each other in the local neighborhood.

The hardest part of the algorithm right now is finding correct coefficients for each message
passing step, but still I love the algorithm for its simplicity and potential for extensions.
It serves well as a starting point to new exploration/algorithms.

You can launch the playground here: http://anvaka.github.io/nb/

## Local development

``` bash
# Clone the source code:
https://github.com/anvaka/nb.git

# install dependencies
cd nb
npm install

# now you are ready start the dev server:
npm start
```

Once the dev server is started - it will print the local address
where the website is running with hot reload (you change the code - it updates the website)

## Support

You can always reach out to me [on twitter](https://twitter.com/anvaka) if you have any questions.
If you love this library, please consider sponsoring it https://github.com/sponsors/anvaka .

## License

MIT