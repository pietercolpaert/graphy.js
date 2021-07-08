/* eslint-disable no-use-before-define */

import {
	RDFJS,
	C1,
	Term,
	PrefixMap,
	Dataset,
	Role,
} from '@graphy/types';

import {
	GenericQuadTree,
} from './common';

import {
	$_KEYS,
	$_QUADS,
	ILinkedQuadTree,
} from './common';

import {
	DataFactory,
} from '@graphy/core';
// } from '../../core/core';

const {
	c1FromGraphRole,
	c1FromSubjectRole,
	c1FromPredicateRole,
	c1FromObjectRole,
	graphFromC1,
	subjectFromC1,
	predicateFromC1,
	objectFromC1,
	concise,
	fromTerm,
} = DataFactory;


/**
 * @fileoverview
 * The following table indicates the names for various groupings of RDF term roles:
 *
 *  ┌─────────┬───────────┬─────────────┬──────────┐
 *  │ <graph> ┊ <subject> ┊ <predicate> ┊ <object> │
 *  ├─────────┴───────────┼─────────────┴──────────┤
 *  │        grub         │           prob         │
 *  ├─────────────────────┴─────────────┬──────────┤
 *  │               greed               │░░░░░░░░░░│
 *  ├─────────┬─────────────────────────┴──────────┤
 *  │░░░░░░░░░│         spred           │░░░░░░░░░░│
 *  ├─────────┼─────────────────────────┴──────────┤
 *  │░░░░░░░░░│               triple               │
 *  ├─────────┴────────────────────────────────────┤
 *  │                      quad                    │
 *  └──────────────────────────────────────────────┘
 *
 */


// const $_KEYS = Symbol(' (keys)');
// const $_QUADS = Symbol(' (quads)');

// interface CountableKeys {
// 	[$_KEYS]: number;
// }

// interface CountableQuads extends CountableKeys {
// 	[$_QUADS]: number;
// }

// type ObjectReferencesMap = CountableQuads & {
// 	[sc1_predicate: string]: Set<C1.Object>;
// };

// interface ObjectDescriptor {
// 	value: C1.Object;
// 	refs: ObjectReferencesMap;
// }

// type ObjectStore = CountableKeys & {
// 	[sc1_object: string]: ObjectDescriptor;
// }

// type ProbsHash = CountableQuads & {
// 	[sc1_predicate: string]: Set<ObjectDescriptor>;
// }

// type TriplesHash = CountableQuads & {
// 	[sc1_subject: string]: ProbsHash;
// }

// type QuadsHash = CountableQuads & {
// 	[sc1_graph: string]: TriplesHash;
// }


export interface Deliverable {
	new(...args: any[]): Dataset.SyncC1Dataset<LinkedQuadTree>;
}

export interface LinkedQuadTreeConstructor extends Deliverable {
	new(...args: any[]): LinkedQuadTree;
}


class LinkedQuadTreeGraspHandle implements Dataset.GraspHandle {
	_k_dataset: LinkedQuadTreeBuilder;
	_kh_grub: LinkedQuadTreeGrubHandle;
	_sc1_predicate: C1.Predicate;
	_sc1_subject: C1.Subject;
	_as_objects: Set<ILinkedQuadTree.ObjectDescriptor>;

	constructor(kh_grub: LinkedQuadTreeGrubHandle, sc1_predicate: C1.Predicate, as_objects: Set<ILinkedQuadTree.ObjectDescriptor>) {
		this._k_dataset = kh_grub._k_dataset;
		this._kh_grub = kh_grub;
		this._sc1_subject = kh_grub._sc1_subject;
		this._sc1_predicate = sc1_predicate;
		this._as_objects = as_objects;
	}

	addC1Object(sc1_object: C1.Object): boolean {
		// ref object store
		const h_objects = this._k_dataset._h_objects;
		const as_objects = this._as_objects;

		// prep object descriptor
		let g_object: ILinkedQuadTree.ObjectDescriptor;

		// object exists in store
		if(sc1_object in h_objects) {
			// ref object descriptor
			g_object = h_objects[sc1_object];

			// triple already exists; nothing was added
			if(as_objects.has(g_object)) {
				return false;
			}
			// triple not yet exists, subject guaranteed to not yet exist in predicate-specific references
			else {
				// ref predicate
				const sc1_predicate = this._sc1_predicate;

				// ref references
				const h_refs = g_object.refs;

				// predicate exists in references
				if(sc1_predicate in h_refs) {
					// add subject to set
					h_refs[sc1_predicate].add(this._sc1_subject);
				}
				// predicate not yet exists in references
				else {
					// create reference
					h_refs[sc1_predicate] = new Set([this._sc1_subject]);

					// update keys counter on references
					h_refs[$_KEYS] += 1;
				}

				// update quads counter on references
				h_refs[$_QUADS] += 1;

				// jump to add
			}
		}
		// object not yet exists in store
		else {
			// create object descriptor
			g_object = h_objects[sc1_object] = {
				value: sc1_object,
				refs: {
					[$_KEYS]: 1,
					[$_QUADS]: 1,
					[this._sc1_predicate]: new Set([this._sc1_subject]),
				} as ILinkedQuadTree.ObjectReferencesMap,
			} as ILinkedQuadTree.ObjectDescriptor;
		}

		// insert into object set
		as_objects.add(g_object);

		// ref quads tree
		const hc4_quads = this._k_dataset._hc4_quads;

		// update quads counter on quads tree
		hc4_quads[$_QUADS] += 1;

		// ref triples tree
		const hc3_triples = hc4_quads[this._kh_grub._kh_graph._sc1_graph];

		// update quads counter on triples tree
		hc3_triples[$_QUADS] += 1;

		// update quads counter on probs tree
		hc3_triples[this._sc1_subject][$_QUADS] += 1;

		// new triple added
		return true;
	}


	deleteC1Object(sc1_object: C1.Object): boolean {
		// ref object store
		const h_objects = this._k_dataset._h_objects;

		// object not exists in store
		if(!(sc1_object in h_objects)) return false;

		// prep object descriptor
		const g_object = h_objects[sc1_object];

		// confine scope
		{
			// ref set of objects
			const as_objects = this._as_objects;

			// triple not exists
			if(!as_objects.has(g_object)) return false;

			// ref quads tree
			const hc4_quads = this._k_dataset._hc4_quads;

			// decrement store-level quad counter
			hc4_quads[$_QUADS] -= 1;

			OPSG: {
				// ref grub handle
				const kh_grub = this._kh_grub;

				// ref graph handle
				const kh_graph = kh_grub._kh_graph;

				// ref triples tree
				const hc3_triples = kh_graph._hc3_triples;

				PSG: {
					// ref probs tree
					const hc2_probs = kh_grub._hc2_probs;

					// ref probs key count
					const nl_keys_probs = hc2_probs[$_KEYS];

					// last object associated with this greed
					if(1 === as_objects.size) {
						// last predicate associated with this grub
						if(1 === nl_keys_probs) {
							// ref triples key count
							const nl_keys_triples = hc3_triples[$_KEYS];

							// last subject associated with this graph, not default graph
							if(1 === nl_keys_triples && '*' !== kh_graph._sc1_graph) {
								// drop given graph
								delete hc4_quads[kh_graph._sc1_graph];

								// decrement key counter
								hc4_quads[$_KEYS] -= 1;

								// no need to decrement others
								break OPSG;
							}
							// other subjects remain or keeping default graph
							else {
								// drop triples tree for given subject
								delete hc3_triples[this._sc1_subject];

								// decrement key counter
								hc3_triples[$_KEYS] = nl_keys_triples - 1;

								// no need to decrement others
								break PSG;
							}
						}
						// other predicates remain
						else {
							// drop probs tree for given predicate
							delete hc2_probs[this._sc1_predicate];

							// decrement key counter
							hc2_probs[$_KEYS] = nl_keys_probs - 1;
						}
					}
					// other objects remain
					else {
						// delete object from set
						as_objects.delete(g_object);
					}

					// decrement subject-level quad counter
					hc2_probs[$_QUADS] -= 1;
				}

				// decrement graph-level quad counter
				hc3_triples[$_QUADS] -= 1;
			}
		}


		// ref object descriptor
		const h_refs = g_object.refs;

		// ref subjects list
		const as_subjects = h_refs[this._sc1_predicate];

		// last subject associated with this prob
		if(1 === as_subjects.size) {
			// ref key count
			const nl_keys_refs = h_refs[$_KEYS];

			// last tuple associated with this object
			if(1 === nl_keys_refs) {
				// delete object from store
				delete h_objects[sc1_object];

				// decrement object key count
				h_objects[$_KEYS] -= 1;
			}
			// other tuples remain
			else {
				// delete predicate from refs
				delete h_refs[this._sc1_predicate];

				// decrement keys counter on references
				h_refs[$_KEYS] -= 1;
			}
		}
		// other subjects remain
		else {
			// delete subject from subjects list
			as_subjects.delete(this._sc1_subject);
		}

		// deleted object
		return true;
	}
}


class LinkedQuadTreeGrubHandle implements Dataset.GrubHandle {
	_k_dataset: LinkedQuadTreeBuilder;
	_kh_graph: InternalGraphHandle;
	_sc1_subject: C1.Subject;
	_hc2_probs: ILinkedQuadTree.ProbsHash;

	constructor(k_dataset: LinkedQuadTreeBuilder, kh_graph: InternalGraphHandle, sc1_subject: C1.Subject, hc2_probs: ILinkedQuadTree.ProbsHash) {
		this._k_dataset = k_dataset;
		this._kh_graph = kh_graph;
		this._sc1_subject = sc1_subject;
		this._hc2_probs = hc2_probs;
	}

	openC1Predicate(sc1_predicate: C1.Predicate): Dataset.GraspHandle {
		// increment keys counter
		const hc2_probs = this._hc2_probs;

		// predicate exists; return tuple handle
		if(sc1_predicate in hc2_probs) {
			return new LinkedQuadTreeGraspHandle(this, sc1_predicate, hc2_probs[sc1_predicate]);
		}
		else {
			// increment keys counter
			hc2_probs[$_KEYS] += 1;

			// create predicate w/ empty objects set
			const as_objects = hc2_probs[sc1_predicate] = new Set<ILinkedQuadTree.ObjectDescriptor>();

			// return tuple handle
			return new LinkedQuadTreeGraspHandle(this, sc1_predicate, as_objects);
		}
	}
}

interface InternalGraphHandle {
	_sc1_graph: C1.Graph;
	_hc3_triples: ILinkedQuadTree.TriplesHash;
}

class LinkedQuadTreeGraphHandle implements InternalGraphHandle, Dataset.GraphHandle {
	_k_dataset: LinkedQuadTreeBuilder;
	_sc1_graph: C1.Graph;
	_hc3_triples: ILinkedQuadTree.TriplesHash;

	constructor(k_dataset: LinkedQuadTreeBuilder, sc1_graph: C1.Graph, hc3_triples: ILinkedQuadTree.TriplesHash) {
		this._k_dataset = k_dataset;
		this._sc1_graph = sc1_graph;
		this._hc3_triples = hc3_triples;
	}

	openC1Subject(sc1_subject: C1.Subject): Dataset.GrubHandle {
		// ref triples tree
		const hc3_triples = this._hc3_triples;

		// subject exists; return subject handle
		if(sc1_subject in hc3_triples) {
			return new LinkedQuadTreeGrubHandle(this._k_dataset, this, sc1_subject, hc3_triples[sc1_subject]);
		}
		else {
			// increment keys counter
			hc3_triples[$_KEYS] += 1;

			// create subject w/ empty probs tree
			const hc2_probs = hc3_triples[sc1_subject] = {
				[$_KEYS]: 0,
				[$_QUADS]: 0,
			} as ILinkedQuadTree.ProbsHash;

			// return subject handle
			return new LinkedQuadTreeGrubHandle(this._k_dataset, this, sc1_subject, hc2_probs);
		}
	}
}

/**
 * Trig-Optimized, Semi-Indexed Dataset in Memory
 * YES: ????, g???, g??o, g?po, gs??, gsp?, gspo
 * SOME: gs?o
 * NOT: ???o, ??p?, ??po, ?s??, ?s?o, ?sp?, ?spo, g?p?
 */
export class LinkedQuadTreeBuilder implements InternalGraphHandle, Dataset.SyncQuadTreeBuilder<Dataset.SyncC1Dataset<LinkedQuadTree>> {
	_h_objects: ILinkedQuadTree.ObjectStore;
	_sc1_graph: C1.Graph = '*';
	_hc3_triples: ILinkedQuadTree.TriplesHash;
	_hc4_quads: ILinkedQuadTree.QuadsHash;
	_h_prefixes: PrefixMap;

	static supportsStar = false;

	constructor(h_prefixes={} as PrefixMap) {
		this._h_prefixes = h_prefixes;

		this._h_objects = {
			[$_KEYS]: 0,
		} as ILinkedQuadTree.ObjectStore;

		const hc3_triples = this._hc3_triples = {
			[$_KEYS]: 0,
			[$_QUADS]: 0,
		} as ILinkedQuadTree.TriplesHash;

		this._hc4_quads = {
			[$_KEYS]: 1,
			[$_QUADS]: 0,
			'*': hc3_triples,
		} as ILinkedQuadTree.QuadsHash;
	}

	get size(): number {
		return this._hc4_quads[$_QUADS];
	}

	deliver(gc_dataset: Dataset.Config={}, dc_dataset: LinkedQuadTreeConstructor=(LinkedQuadTree as LinkedQuadTreeConstructor)): LinkedQuadTree {
		return new LinkedQuadTree(this._h_objects, this._hc4_quads, gc_dataset || {});
	}

	* [Symbol.iterator](): Iterator<Term.Quad> {
		// ref prefixes
		const h_prefixes = this._h_prefixes;

		// ref quads tree
		const hc4_quads = this._hc4_quads;

		// each graph
		for(const sc1_graph in hc4_quads) {
			// make graph node
			const kt_graph = graphFromC1(sc1_graph as C1.Graph, h_prefixes);

			// ref triples tree
			const hc3_triples = hc4_quads[sc1_graph];

			// each subject
			for(const sc1_subject in hc3_triples) {
				// make subject node
				const kt_subject = subjectFromC1(sc1_subject as C1.Subject, h_prefixes);

				// ref probs tree
				const hc2_probs = hc3_triples[sc1_subject];

				// each predicate
				for(const sc1_predicate in hc2_probs) {
					// make predicate node
					const kt_predicate = predicateFromC1(sc1_predicate as C1.Predicate, h_prefixes);

					// ref objects
					const as_objects = hc2_probs[sc1_predicate];

					// each object
					for(const g_object of as_objects) {
						// make object node
						const kt_object = objectFromC1(g_object.value, h_prefixes);

						// yield quad
						yield DataFactory.quad(kt_subject, kt_predicate, kt_object, kt_graph);
					}
				}
			}
		}
	}

	distinctGraphCount(): number {  // eslint-disable-line require-await
		// graph count
		return this._hc4_quads[$_KEYS];
	}

	distinctSubjectCount(): number {  // eslint-disable-line require-await
		// only default graph
		if(1 === this._hc4_quads[$_KEYS]) {
			return this._hc3_triples[$_KEYS];
		}
		// multiple graphs
		else {
			let as_subjects = new Set();
			for(const sc1_graph in this._hc4_quads) {
				as_subjects = new Set([...as_subjects, ...Object.keys(this._hc4_quads[sc1_graph])]);
			}
			return as_subjects.size;
		}
	}

	distinctPredicateCount(): number {  // eslint-disable-line require-await
		// only default graph
		if(1 === this._hc4_quads[$_KEYS]) {
			const as_predicates = new Set();
			for(const sc1_predicate in this._hc3_triples) {
				as_predicates.add(sc1_predicate);
			}
			return as_predicates.size;
		}
		// multiple graphs
		else {
			const as_predicates = new Set();
			const h_objects = this._h_objects;
			for(const sc1_object in h_objects) {
				for(const sc1_predicate in Object.keys(h_objects[sc1_object].refs)) {
					as_predicates.add(sc1_predicate);
				}
			}
			return as_predicates.size;
		}
	}

	distinctObjectCount(): number {  // eslint-disable-line require-await
		return this._h_objects[$_KEYS];
	}

	attachPrefixes(h_prefixes: PrefixMap): void {
		this._h_prefixes = h_prefixes;
	}

	openGraph(y_graph: Role.Graph): LinkedQuadTreeGraphHandle {
		return this.openC1Graph(c1FromGraphRole(y_graph, this._h_prefixes));
	}

	openC1Graph(sc1_graph: C1.Graph): LinkedQuadTreeGraphHandle {
		// ref quads tree
		const hc4_quads = this._hc4_quads;

		// graph exists; return subject handle
		if(sc1_graph in hc4_quads) {
			return new LinkedQuadTreeGraphHandle(this, sc1_graph, hc4_quads[sc1_graph]);
		}
		else {
			// increment keys counter
			hc4_quads[$_KEYS] += 1;

			// create graph w/ empty triples tree
			const hc3_triples = hc4_quads[sc1_graph] = {
				[$_KEYS]: 0,
				[$_QUADS]: 0,
			} as ILinkedQuadTree.TriplesHash;

			// return subject handle
			return new LinkedQuadTreeGraphHandle(this, sc1_graph, hc3_triples);
		}
	}

	openSubject(y_subject: Role.Subject): LinkedQuadTreeGrubHandle {
		return this.openC1Subject(c1FromSubjectRole(y_subject, this._h_prefixes));
	}

	openC1Subject(sc1_subject: C1.Subject): LinkedQuadTreeGrubHandle {
		// ref default graph triples tree
		const hc3_triples = this._hc3_triples;

		// subject exists; return subject handle
		if(sc1_subject in hc3_triples) {
			return new LinkedQuadTreeGrubHandle(this, this, sc1_subject, hc3_triples[sc1_subject]);
		}
		// subject not yet exists
		else {
			// increment keys counter
			hc3_triples[$_KEYS] += 1;

			// create subject w/ empty probs tree
			const hc2_probs = hc3_triples[sc1_subject] = {
				[$_KEYS]: 0,
				[$_QUADS]: 0,
			} as ILinkedQuadTree.ProbsHash;

			// return subject handle
			return new LinkedQuadTreeGrubHandle(this, this, sc1_subject, hc2_probs);
		}
	}

	addTriple(sc1_subject: C1.Subject, sc1_predicate: C1.Predicate, sc1_object: C1.Object): boolean {
		return this.openC1Subject(sc1_subject).openC1Predicate(sc1_predicate).addC1Object(sc1_object);
	}

	add(g_quad: RDFJS.Quad): this {
		const h_prefixes = this._h_prefixes;
		const yt_subject = g_quad.subject;

		this.openC1Graph(c1FromGraphRole(g_quad.graph as Role.Graph, h_prefixes))
			.openC1Subject('NamedNode' === yt_subject.termType? concise(yt_subject.value, h_prefixes): ('#'+yt_subject.value) as C1.BlankNode)
			.openC1Predicate(concise(g_quad.predicate.value, h_prefixes))
			.addC1Object(fromTerm<Term.Object>(g_quad.object).concise(h_prefixes));

		return this;
	}

	has(g_quad: RDFJS.Quad): boolean {
		// ref prefixes
		const h_prefixes = this._h_prefixes;

		// fetch triples tree
		const hc3_triples = this._hc4_quads[c1FromGraphRole(g_quad.graph as Role.Graph, h_prefixes)];

		// none
		if(!hc3_triples) return false;

		// ref subject
		const yt_subject = g_quad.subject;

		// create subject c1
		const sc1_subject = 'NamedNode' === yt_subject.termType? concise(yt_subject.value, h_prefixes): '_:'+yt_subject.value;

		// fetch probs tree
		const hc2_probs = hc3_triples[concise(sc1_subject, h_prefixes)];

		// none
		if(!hc2_probs) return false;

		// fetch objects list
		const as_objects = hc2_probs[concise(g_quad.predicate.value, h_prefixes)];

		// none
		if(!as_objects) return false;

		// create object c1
		const sc1_object = fromTerm(g_quad.object).concise(h_prefixes);

		// object exists in store
		const g_object = this._h_objects[sc1_object];

		// no object
		if(!g_object) return false;

		// use native set .has()
		return as_objects.has(g_object);
	}

	delete(g_quad: RDFJS.Quad): this {
		const h_prefixes = this._h_prefixes;
		const yt_subject = g_quad.subject;

		this.openC1Graph(c1FromGraphRole(g_quad.graph as Role.Graph, h_prefixes))
			.openC1Subject('NamedNode' === yt_subject.termType? concise(yt_subject.value, h_prefixes): ('#'+yt_subject.value) as C1.BlankNode)
			.openC1Predicate(concise(g_quad.predicate.value, h_prefixes))
			.deleteC1Object(fromTerm<Term.Object>(g_quad.object).concise(h_prefixes));

		return this;
	}

	match(yt_subject?: RDFJS.Term, yt_predicate?: RDFJS.Term, yt_object?: RDFJS.Term, yt_graph?: RDFJS.Term): LinkedQuadTree {
		throw new Error('Method not yet implemented.');
		// return LinkedQuadTree.empty(this._h_prefixes);
	}

}


export class LinkedQuadTree extends GenericQuadTree<
	LinkedQuadTree, ILinkedQuadTree.QuadsHash, ILinkedQuadTree.TriplesHash
> implements Dataset.SyncC1Dataset<LinkedQuadTree> {
	/**
	 * Create new LinkedQuadTreeBuilder
	 */
	static builder(h_prefixes: PrefixMap): LinkedQuadTreeBuilder {
		return new LinkedQuadTreeBuilder(h_prefixes);
	}

	/**
	 * Create new empty dataset
	 */
	 static empty(h_prefixes: PrefixMap): LinkedQuadTree {
		return new LinkedQuadTree({
			[$_KEYS]: 0,
		}, {
			[$_KEYS]: 1,
			[$_QUADS]: 0,
			// [$_OVERLAY]: 0,
			// [$_BURIED]: [],
			['*']: {
				[$_KEYS]: 0,
				[$_QUADS]: 0,
				// [$_OVERLAY]: 0,
				// [$_BURIED]: [],
			},
		}, h_prefixes);
	}

	/**
	 * Internal self builder for creating match results or appending
	 * @internal
	 */
	_k_builder: LinkedQuadTreeBuilder;

	/**
	 * Data structure for linking Object terms
	 * @internal
	 */
	_h_objects: ILinkedQuadTree.ObjectStore;

	constructor(h_objects: ILinkedQuadTree.ObjectStore, hc4_quads: ILinkedQuadTree.QuadsHash, gc_dataset: Dataset.Config={}) {
		super(hc4_quads, gc_dataset);
		this._h_objects = h_objects;
		this._k_builder = new LinkedQuadTreeBuilder(this._h_prefixes);
	}

	addC1Quad(subject: C1.Node, predicate: C1.NamedNode, object: C1.Object, graph?: C1.Graph): boolean {
		throw new Error('Method not implemented.');
	}
	
	clone(prefixes: PrefixMap): LinkedQuadTree {
		throw new Error('Method not implemented.');
	}
	
	prefixed(): LinkedQuadTree {
		throw new Error('Method not implemented.');
	}
	
	expanded(): LinkedQuadTree {
		throw new Error('Method not implemented.');
	}
	
	add(quad: any): this {
		throw new Error('Method not implemented.');
	}
	
	delete(quad: any): this {
		throw new Error('Method not implemented.');
	}
	
	has(quad: any): boolean {
		throw new Error('Method not implemented.');
	}
	
	match(yt_subject?: Role.Subject, yt_predicate?: Role.Predicate, yt_object?: Role.Object, yt_graph?: Role.Graph): LinkedQuadTree {
		throw new Error('Method not implemented.');
	}
	
	contains(other: any): boolean {
		throw new Error('Method not implemented.');
	}
	
	disjoint(other: any): boolean {
		throw new Error('Method not implemented.');
	}
	
	minus(other: Dataset.SyncDataset): Dataset.SyncDataset {
		throw new Error('Method not implemented.');
	}
	
	normalize(): LinkedQuadTree {
		throw new Error('Method not implemented.');
	}

	_equals(k_other: LinkedQuadTree): boolean {
		const h_objects_a = this._h_objects;
		const h_objects_b = k_other._h_objects;

		// object count mismatch
		if(h_objects_a[$_KEYS] !== h_objects_b[$_KEYS]) return false;

		const hc4_quads_a = this._hc4_quads;
		const hc4_quads_b = k_other._hc4_quads;

		// each graph in a
		for(const sc1_graph in hc4_quads_a) {
			// ref trips
			const hc3_trips_a = hc4_quads_a[sc1_graph];
			const hc3_trips_b = hc4_quads_b[sc1_graph];

			// graph missing from b
			if(!hc3_trips_b) return false;

			// quad count mismatch
			if(hc3_trips_a[$_QUADS] !== hc3_trips_b[$_QUADS]) return false;

			// key count mismatch
			if(hc3_trips_a[$_KEYS] !== hc3_trips_b[$_KEYS]) return false;

			// each subject in a
			for(const sc1_subject in hc3_trips_a) {
				// ref probs
				const hc2_probs_a = hc3_trips_a[sc1_subject];
				const hc2_probs_b = hc3_trips_b[sc1_subject];

				// subject missing from b
				if(!hc2_probs_b) return false;

				// quad count mismatch
				if(hc2_probs_a[$_QUADS] !== hc2_probs_b[$_QUADS]) return false;

				// key count mismatch
				if(hc2_probs_a[$_KEYS] !== hc2_probs_b[$_KEYS]) return false;

				// each predicate in a
				for(const sc1_predicate in hc2_probs_a) {
					// ref objects
					const as_objects_a = hc2_probs_a[sc1_predicate];
					const as_objects_b = hc2_probs_b[sc1_predicate];

					// predicate missing from b
					if(!as_objects_b) return false;

					// set size mismatch
					if(as_objects_a.size !== as_objects_b.size) return false;

					// each object in a
					for(const g_object of as_objects_a) {
						// fetch descriptor in b
						const g_object_b = h_objects_b[g_object.value];

						// object missing from b
						if(!g_object_b) return false;

						// quad missing from b
						if(!as_objects_b.has(g_object_b)) return false;
					}
				}
			}
		}

		// datasets match
		return true;
	}

	* [Symbol.iterator](): Generator<Term.Quad> {
		// ref prefixes
		const h_prefixes = this._h_prefixes;

		// ref quads tree
		const hc4_quads = this._hc4_quads;

		// each graph
		for(const sc1_graph in hc4_quads) {
			// make graph node
			const kt_graph = graphFromC1(sc1_graph as C1.Graph, h_prefixes);

			// ref triples tree
			const hc3_triples = hc4_quads[sc1_graph];

			// each subject
			for(const sc1_subject in hc3_triples) {
				// make subject node
				const kt_subject = subjectFromC1(sc1_subject as C1.Subject, h_prefixes);

				// ref probs tree
				const hc2_probs = hc3_triples[sc1_subject];

				// each predicate
				for(const sc1_predicate in hc2_probs) {
					// make predicate node
					const kt_predicate = predicateFromC1(sc1_predicate as C1.Predicate, h_prefixes);

					// ref objects
					const as_objects = (hc2_probs as ILinkedQuadTree.ProbsHash)[sc1_predicate];

					// each object
					for(const g_object of as_objects) {
						// make object node
						const kt_object = objectFromC1(g_object.value, h_prefixes);

						// yield quad
						yield DataFactory.quad(kt_subject, kt_predicate, kt_object, kt_graph);
					}
				}
			}
		}
	}


	protected _all_distinct_predicates(): Set<C1.Predicate> {
		// distinct predicates set
		const as_predicates = new Set<C1.Predicate>();

		// ref objects store
		const h_objects = this._h_objects;

		// each object
		for(const sc1_object in h_objects) {
			// each predicate in object refs; add to set
			for(const sc1_predicate in Object.keys(h_objects[sc1_object].refs)) {
				as_predicates.add(sc1_predicate as C1.Predicate);
			}
		}

		// return set
		return as_predicates;
	}


	protected _all_distinct_objects(): Set<C1.Object> {
		// distinct objects set
		const as_objects = new Set<C1.Object>();

		// each object; add to set
		for(const sc1_object in this._h_objects) {
			as_objects.add(sc1_object as C1.Object);
		}

		// return set
		return as_objects;
	}

	distinctPredicateCount(): number {
		// only default graph
		if(1 === this._hc4_quads[$_KEYS]) {
			const as_predicates = new Set();
			for(const sc1_predicate in this._hc3_trips) {
				as_predicates.add(sc1_predicate);
			}
			return as_predicates.size;
		}
		// multiple graphs
		else {
			return this._all_distinct_predicates().size;
		}
	}

	distinctObjectCount(): number {
		return this._h_objects[$_KEYS];
	}


	distinctC1Predicates(): Set<C1.Predicate> {
		return this._all_distinct_predicates();
	}

	distinctC1Objects(): Set<C1.Object> {
		return this._all_distinct_objects();
	}


	* distinctPredicates(): Generator<Term.Predicate> {
		// ref prefixes
		const h_prefixes = this._h_prefixes;

		// each predicate
		for(const sc1_predicate of this._all_distinct_predicates()) {
			yield predicateFromC1(sc1_predicate, h_prefixes);
		}
	}

	* distinctObjects(): Generator<Term.Object> {
		// ref prefixes
		const h_prefixes = this._h_prefixes;

		// each object
		for(const sc1_object of this._all_distinct_objects()) {
			yield objectFromC1(sc1_object, h_prefixes);
		}
	}


	sibling(): LinkedQuadTree {
		throw new Error('not implemented');
	}
	
	deleteMatches(yt_subject?: Role.Subject, predicate?: Role.Predicate, object?: Role.Object, graph?: Role.Graph): this {
		throw new Error('not implemented');
	}
	
	difference(y_other: RDFJS.Dataset): LinkedQuadTree {
		throw new Error('not implemented');
	}

	filter(f_iteratee: (g_quad: Term.Quad, kd_dataset: this) => boolean): LinkedQuadTree {
		throw new Error('not implemented');
	}

	import(ds_stream: RDFJS.Stream): Promise<this> {
		throw new Error('not implemented');
	}

	intersection(y_other: RDFJS.Dataset): LinkedQuadTree {
		throw new Error('not implemented');
	}

	union(y_other: RDFJS.Dataset): LinkedQuadTree {
		throw new Error('not implemented');
	}
}


LinkedQuadTree.prototype.toCanonical = LinkedQuadTree.prototype.normalize;


// typings for fixed prototype properties
export interface LinkedQuadTree {
	/**
	 * Indicates at runtime without that this class is compatible as a graphy dataset
	 */
	isGraphyDataset: true;

	/**
	 * Describes at runtime the canonical storage type interface for this datatset
	 */
	datasetStorageType: string;

	/**
	 * For typing static properties and methods
	 */
	// constructor: Dataset.Constructor<LinkedQuadTree, typeof LinkedQuadTreeBuilder, ILinkedQuadTree.QuadsHash>;

	toCanonical(): LinkedQuadTree;
}

type LinkedQuadTreeClass = GenericQuadTree.Static<LinkedQuadTree, LinkedQuadTreeBuilder, ILinkedQuadTree.QuadsHash>;


const LinkedQuadTree_Assertion: LinkedQuadTreeClass = LinkedQuadTree;


LinkedQuadTree.prototype.isGraphyDataset = true;


LinkedQuadTree.prototype.datasetStorageType = `
	descriptor {
		value: c1;
		refs: {
			[p: c1]: s;
		};
	};
	objects {
		[o: c1]: descriptor;
	};
	quads {
		[g: c1]: trips {
			[s: c1]: probs {
				[p: c1]: Set<descriptor>;
			};
		};
	};
`.replace(/\s+/g, '');