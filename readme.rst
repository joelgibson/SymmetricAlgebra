Symmetric Functions
===================

Some code for computing in the ring of symmetric functions, and the representation ring of GL(n). `See it in action <http://jgibson.id.au/articles/symfunc/>`_.


Building and Testing
--------------------

Use

.. code-block:: fish

    npm install

to install the typescript compiler and testing/benchmarking libraries. The only dependency of the code itself is the typescript compiler, and it has no runtime dependencies. Here are some handy commands defined in :code:`package.json`:

.. code-block:: fish

    npm test              # Run the tests in test/
    npm run-script bench  # Run the benchmarks in bench/
    npm run-script build  # Generate symfunc.js from interface.ts.
    npm run-script clean  # Remove all compiled javascript and sourcemap files.

The file :code:`SymmetricAlgebra.html` has a barebones implementation of what you might do with this, and is tightly coupled to :code:`interface.ts`. Aside from that, the rest of the code should be fairly usable as a library, and is roughly structured as follows:

* :code:`crystal.ts` knows the GL(n) crystal operators, and how to tensor crystals. It also knows how to multiply partitions using this rule, and compute dimensions using hook length formulae.
* :code:`algebra.ts` implements linear combinations of partitions. There is nothing much interesting in here, aside from a little logic about how to restrict to the representation ring of GL(n), as well as which n to use when multiplying partitions.
* :code:`parse.ts` has a very ad-hoc parser for expressions, and uses the operations in :code:`algebra.ts` to evaluate expressions.


TODO
----

A laundry list of items to fix.

* Eventually, it would be nice to use exact arithmetic to do things like the hook length dimension calculations. Feels so bad rounding floats.
* I wonder how hard the Kronecker product is to implement...
