import arginfo from 'arginfo';
import assert from 'assert';
import graphy from '../lib/main';
import h_graph from './graph.json';


const eq = assert.strictEqual.bind(assert);
const deep = assert.deepEqual.bind(assert);
const includes = (a_list, a_test) => {
	a_test.forEach((s_item) => {
		assert(a_list.includes(s_item), 'list does not include '+s_item+'; '+arginfo(a_list));
	});
};

// mocha hack
describe('graphy', () => {
	it('can wait', () => {
		eq(true, true);
	});

	// async get graphy
	graphy(h_graph, (q_graph) => {

		// select banana
		let k_banana = q_graph.select('ns:Banana', 'ns:');

		//
		describe('node', () => {

			it('contains @id property', () => {
				eq(k_banana['@id'], 'vocab://ns/Banana');
			});

			it('contains @type property', () => {
				deep(k_banana['@type'], ['vocab://plant/Fruit', 'vocab://ns/Food']);
			});

			it('contains suffixed id property', () => {
				eq(k_banana.$id(), 'Banana');
			});

			it('contains suffixed type property', () => {
				eq(k_banana.$type(), 'Food');
			});

			it('contains types as array', () => {
				deep(k_banana.$types(), ['Food']);
			});

			it('allows types() ns change', () => {
				deep(k_banana.$types('plant:'), ['Fruit']);
			});

			it('supports namespace change', () => {
				eq(k_banana.$('plant:').blossoms.$('ns:').$id(), 'YearRound');
			});

			it('serializes to n3', () => {
				eq(k_banana.$n3(), 'ns:Banana');
			});

			it('serializes to nqaud', () => {
				eq(k_banana.$nquad(), '<vocab://ns/Banana>');
			});

			it('has node type indicator', () => {
				eq(k_banana.$is.node, true);
			});

			it('calling type indicator returns node', () => {
				eq(k_banana.$is(), 'node');
			});
		});


		//
		describe('typed literal', () => {

			it('returns primitive value when called', () => {
				eq(k_banana.$('rdfs:').label(), 'Banana');
			});

			it('returns primitive value when is numeric and called', () => {
				eq(k_banana.data(), 25);
			});

			it('contains @type property', () => {
				eq(k_banana.tastes['@type'], 'http://www.w3.org/2001/XMLSchema#string');
			});

			it('contains @value property', () => {
				eq(k_banana.tastes['@value'], '"good"');
			});

			it('suffixes namespaced datatype', () => {
				eq(k_banana.shape.$type(), 'Liberty');
			});

			it('does not mis-suffix non-namespaced datatype', () => {
				eq(k_banana.$('rdfs:').label.$type(), undefined);
			});

			it('suffixes datatype on namespace changed', () => {
				eq(k_banana.$('rdfs:').label.$type('xsd:'), 'string');
			});

			it('has literal type indicator', () => {
				eq(k_banana.$('rdfs:').label.$is.literal, true);
			});

			it('calling type indicator returns literal', () => {
				eq(k_banana.$('rdfs:').label.$is(), 'literal');
			});

			it('serializes to nquad', () => {
				eq(k_banana.$('rdfs:').label.$nquad(), '"Banana"^^<http://www.w3.org/2001/XMLSchema#string>');
			});

			it('nquad contains datatype property', () => {
				eq(k_banana.$('rdfs:').label.$nquad.datatype(), '<http://www.w3.org/2001/XMLSchema#string>');
			});

			it('serializes to n3; supports auto-prefixing datatype with literal', () => {
				eq(k_banana.$('rdfs:').label.$n3(), '"Banana"^^xsd:string');
			});

			it('supports auto-prefixing just datatype', () => {
				eq(k_banana.$('rdfs:').label.$n3.datatype(), 'xsd:string');
			});
		});


		describe('iri', () => {

			it('contains @id property', () => {
				eq(k_banana.appears['@id'], 'vocab://color/Yellow');
			});

			it('contains @type property', () => {
				eq(k_banana.class['@type'], '@id');
			});

			it('contains suffixed id property', () => {
				eq(k_banana.class.$id(), 'Berry');
			});

			it('suffixes iri when called', () => {
				eq(k_banana.class(), 'Berry');
			});

			it('does not mis-suffix non-namespaced iri', () => {
				eq(k_banana.appears(), undefined);
			});

			it('suffixes datatype on namespace changed', () => {
				eq(k_banana.appears.$('color:').$id(), 'Yellow');
			});

			it('serializes to n3', () => {
				eq(k_banana.appears.$n3(), 'color:Yellow');
			});

			it('serializes to nquad', () => {
				eq(k_banana.class.$nquad(), '<vocab://ns/Berry>');
			});

			it('has iri type indicator', () => {
				eq(k_banana.appears.$is.iri, true);
			});

			it('calling type indicator returns iri', () => {
				eq(k_banana.appears.$is(), 'iri');
			});

			it('emulates rdf namespace for rdf:type', () => {
				eq(k_banana.$('rdf:')('type').filter(x => x.$in('ns:'))[0].$('ns:').$id(), 'Food');
			});

			it('dereferences to node', () => {
				eq(k_banana.$types.filter(x => x.$in('plant:'))[0].$node('ns:').contains.$id('plant:'), 'Seeds');
			});
		});


		describe('graphy predicate points to multiple objects', () => {

			it('supports forEach', () => {
				let a_items = [];
				k_banana('alias').forEach((k_item) => {
					a_items.push(k_item());
				});
				includes(a_items, ['Cavendish', 'Naner', 'Bananarama']);
			});

			it('supports implicit map callback', () => {
				let a_items = k_banana('alias', (k_item) => {
					return k_item();
				});
				includes(a_items, ['Cavendish', 'Naner', 'Bananarama']);
			});

		});


		describe('graphy collection', () => {

			it('serializes to n3', () => {
				eq(k_banana.stages.$n3(), '[rdf:first ns:FindSpace;rdf:rest (plant:Seed plant:Grow plant:Harvest)]');
			});

			it('serializes to nquad', () => {
				eq(k_banana.stages.$nquad(), '_:b5 <http://www.w3.org/1999/02/22-rdf-syntax-ns#first> <vocab://ns/FindSpace>. '
					+'_:b5 <http://www.w3.org/1999/02/22-rdf-syntax-ns#rest> _:b6. '
					+'_:b6 <http://www.w3.org/1999/02/22-rdf-syntax-ns#first> <vocab://plant/Seed>. '
					+'_:b6 <http://www.w3.org/1999/02/22-rdf-syntax-ns#rest> _:b7. '
					+'_:b7 <http://www.w3.org/1999/02/22-rdf-syntax-ns#first> <vocab://plant/Grow>. '
					+'_:b7 <http://www.w3.org/1999/02/22-rdf-syntax-ns#rest> _:b8. '
					+'_:b8 <http://www.w3.org/1999/02/22-rdf-syntax-ns#first> <vocab://plant/Harvest>. '
					+'_:b8 <http://www.w3.org/1999/02/22-rdf-syntax-ns#rest> <http://www.w3.org/1999/02/22-rdf-syntax-ns#nil>. ');
			});

			it('supports implicit map callback', () => {
				let a_items = k_banana.stages((k_item) => {
					return k_item.$id() || k_item.$('plant:').$id();
				});
				eq(Array.isArray(a_items), true);
				deep(a_items, ['FindSpace', 'Seed', 'Grow', 'Harvest']);
			});

			it('returns simple array on invocation', () => {
				let a_items = [];
				k_banana.stages().forEach((k_item) => {
					a_items.push(k_item.$id() || k_item.$('plant:').$id());
				});
				includes(a_items, ['FindSpace', 'Seed', 'Grow', 'Harvest']);
			});

			it('emulates rdf:first/next/nil', () => {
				let a_rdf = k_banana.stages.$('rdf:');
				eq(a_rdf.first.$('ns:').$id(), 'FindSpace');
				let w_rest = a_rdf.rest;
				eq(w_rest.first.$('plant:').$id(), 'Seed');
				w_rest = w_rest.rest;
				eq(w_rest.first.$('plant:').$id(), 'Grow');
				w_rest = w_rest.rest;
				eq(w_rest.first.$('plant:').$id(), 'Harvest');
				w_rest = w_rest.rest;
				eq(w_rest.$id(), 'nil');
			});

			it('has collection type indicator', () => {
				eq(k_banana.stages.$is.collection, true);
			});

			it('calling type indicator returns collection', () => {
				eq(k_banana.stages.$is(), 'collection');
			});
		});
	});
});

	// describe('graphy blanknode', () => {

	// 	q_graph.network('ns:', (k_banana) => {

	// 		//
	// 		let k_node = k_banana.

	// 		it('contains @id property', () => {
	// 			eq(k_banana['@id'], 'vocab://ns/Banana');
	// 		});

	// 		it('contains @type property', () => {
	// 			eq(k_banana['@type'], 'vocab://ns/Fruit');
	// 		});

	// 		it('contains suffixed id property', () => {
	// 			eq(k_banana.$id, 'Banana');
	// 		});

	// 		it('contains suffixed type property', () => {
	// 			eq(k_banana.$type, 'Fruit');
	// 		});

	// 		it('supports namespace change', () => {
	// 			eq(k_banana.$('plant:').blossoms.$('ns:').$id, 'YearRound');
	// 		});

	// 		it('has node type indicator', () => {
	// 			eq(k_banana.$is.node, true);
	// 		});

	// 		it('calling type indicator returns node', () => {
	// 			eq(k_banana.$is(), 'node');
	// 		});
	// 	});
	// });


	// describe('graphy simple literal', () => {

	// 	q_graph.network('ns:', (k_banana) => {

	// 		it('returns primitive value when called', () => {
	// 			eq(k_banana.tastes(), 'good');
	// 		});

	// 		it('does not contain @type property', () => {
	// 			eq(k_banana.tastes['@type'], undefined);
	// 		});

	// 		it('contains @full property; ttl serialization', () => {
	// 			eq(k_banana.tastes['@full'], '"good"');
	// 		});

	// 		it('has literal type indicator', () => {
	// 			eq(k_banana.tastes.$is.literal, true);
	// 		});

	// 		it('calling type indicator returns literal', () => {
	// 			eq(k_banana.tastes.$is(), 'literal');
	// 		});

	// 		it('returns simple literal without datatype', () => {
	// 			eq(k_banana.tastes.$terse(), '"good"');
	// 		});

	// 		it('returns undefined datatype on terse', () => {
	// 			eq(k_banana.tastes.$terse.datatype(), undefined);
	// 		});

	// 	});
	// });



	// describe('graphy interface function', () => {
	// 	let a_nodes = graphy(h_graph).network('ns:');

	// 	it('supports forEach', () => {
	// 		a_nodes.forEach((k_node) => {
	// 			eq(k_node.$id, 'Banana');
	// 		});
	// 	});

	// 	it('supports [0]', () => {
	// 		eq(a_nodes[0].$id, 'Banana');
	// 	});
	// });
// });
