import {
	MergeAll,
} from 'ts-toolbelt/out/Object/MergeAll';

import {
	Iri,
	Prefix,
	Suffix,
} from './common';

import {
	A1_DefaultGraph,
	A1_NamedNode,
	A1_LabeledBlankNode,
	A1_AnonymousBlankNode,
	A1_SimpleLiteral,
	A1_LanguagedLiteral,
	A1_DatatypedLiteral,
	A1_Variable,
	A1_Quad,
} from './a1';

import {
	PrefixMap,
	PrefixMapArg,
} from '../structs'

import {
	ConcisifyIri,
} from './common';

import {
	SupportedRdfMode,
	RdfMode_11,
	RdfMode_star,
	RdfMode_easier,
} from '../const';

import type {
	RemapRole,
} from '../terms/role';


export type C1_Data = A1_DefaultGraph | C1_NamedNode | C1_LabeledBlankNode | C1_AnonymousBlankNode
	| C1_SimpleLiteral | C1_LanguagedLiteral | C1_DatatypedLiteral | C1_Quad;

export type C1_Term = C1_Data | C1_Variable;

export type C1_Item = C1_Term | C1_Directive;

/**
 * Concise term string for DefaultGraph terms
 */
export type C1_DefaultGraph = A1_DefaultGraph;


// /**
//  * Concise term string for PrefixedNamedNode terms
//  */
// export type C1_PrefixedNamedNode<
// 	s_prefix extends string=string,
// 	s_suffix extends string=string,
// > = string extends s_prefix
// 	? (string extends s_suffix
// 		? `${Prefix}:${Suffix}`
// 		: `${Prefix}:${s_suffix}`
// 	)
// 	: string extends s_suffix
// 		? `${s_prefix}:${Suffix}`
// 		: `${s_prefix}:${s_suffix}`;


// /**
//  * Concise term string for AbsoluteNamedNode terms
//  */
// export type C1_AbsoluteNamedNode<
// 	p_iri extends string=string,
// > = string extends p_iri
// 	? `>${Iri}`
// 	: p_iri extends Iri
// 		? `>${p_iri}`
// 		: never;


export type C1_Node = C1_NamedNode | C1_BlankNode;

export type C1_BlankNode = C1_AnonymousBlankNode | C1_LabeledBlankNode;

export type C1_Literal = C1_SimpleLiteral | C1_LanguagedLiteral | C1_DatatypedLiteral;


type Remapper_C1 = {
	Data: C1_Data;
	DefaultGraph: C1_DefaultGraph;
	Node: C1_Node;
	NamedNode: C1_NamedNode;
	Literal: C1_Literal;
	Quad: C1_Quad;
};


export type C1_Graph<
	s_mode extends SupportedRdfMode=RdfMode_11,
> = RemapRole<s_mode, Remapper_C1, 'graph'>;

export type C1_Subject<
	s_mode extends SupportedRdfMode=RdfMode_11,
> = RemapRole<s_mode, Remapper_C1, 'subject'>;

export type C1_Predicate<
	s_mode extends SupportedRdfMode=RdfMode_11,
> = RemapRole<s_mode, Remapper_C1, 'predicate'>;

export type C1_Object<
	s_mode extends SupportedRdfMode=RdfMode_11,
> = RemapRole<s_mode, Remapper_C1, 'object'>;

export type C1_Datatype<
	s_mode extends SupportedRdfMode=RdfMode_11,
> = RemapRole<s_mode, Remapper_C1, 'datatype'>;


/**
 * Concise term string for NamedNode terms
 */
export type C1_NamedNode<
	p_iri extends string=string,
	h_prefixes extends PrefixMapArg={},
> = ConcisifyIri<p_iri, h_prefixes>;


/**
 * Concise term string for LabeledBlankNode terms
 */
export type C1_LabeledBlankNode<
	s_label extends string=string,
> = A1_LabeledBlankNode<s_label>;


/**
 * Concise term string for AnonymousBlankNode terms
 */
export type C1_AnonymousBlankNode<
	s_id extends string=string,
> = A1_AnonymousBlankNode<s_id>;


/**
 * Concise term string for SimpleLiteral terms
 */
export type C1_SimpleLiteral<
	s_content extends string=string,
> = A1_SimpleLiteral<s_content>;


/**
 * Concise term string for LanguagedLiteral terms
 */
export type C1_LanguagedLiteral<
	s_content extends string=string,
	s_language extends string=string,
> = A1_LanguagedLiteral<s_content, s_language>


/**
 * Concise term string for DatatypedLiteral terms
 */
export type C1_DatatypedLiteral<
	s_content extends string=string,
	p_datatype extends string=string,
	h_prefixes extends PrefixMap={},
> = `^${ConcisifyIri<p_datatype, h_prefixes>}"${s_content}`;


/**
 * Concise term string for Variable terms
 */
export type C1_Variable<
	s_name extends string=string,
> = A1_Variable<s_name>;


/**
 * Concise term string for Quad terms
 */
export type C1_Quad<
	sc1_subject extends string=string,
	sc1_predicate extends string=string,
	sc1_object extends string=string,
	sc1_graph extends string=string,
> = A1_Quad<sc1_subject, sc1_predicate, sc1_object, sc1_graph>;


export type C1_Directive = `\`${string}`;
