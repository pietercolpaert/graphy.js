
const factory = require('@graphy/core.data.factory');
const trig_write = require('@graphy/content.trig.write');

let y_writer = trig_write({
	prefixes: {
		rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
		rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
		owl: 'http://www.w3.org/2002/07/owl#',
		dbr: 'http://dbpedia.org/resource/',
		dbo: 'http://dbpedia.org/ontology/',
		demo: 'http://ex.org/demo#',
	},
});

y_writer.pipe(process.stdout);

// the following demonstrates the use of a concise quads hash
y_writer.write({
	type: 'c4',
	value: {
		// example 2 from TriG: https://www.w3.org/TR/trig/
		[factory.comment()]: 'default graph',
		'*': {
			'demo:bob': {
				'dc:publisher': '"Bob',
			},
			'demo:alice': {
				'dc:publisher': '"Alice',
			},
		},

		'demo:bob': {
			'_:a': {
				'foaf:name': '"Bob',
				'foaf:mbox': '>mailto:bob@oldcorp.example.org',
				'foaf:knows': '_:b',
			},
		},

		'demo:alice': {
			'_:b': {
				'foaf:name': '"Alice',
				'foaf:mbox': '>mailto:alice@work.example.org',
			},
		},
	},
});

y_writer.end();
