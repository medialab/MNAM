import os
import csv 
import csvkit
import time

from TextFields import TextFields

from pprint import pprint
from treetagger import TreeTagger
from collections import defaultdict

# Get stopwords from file
STOPWORDS = [s.rstrip() for s in open('stopwords-fr.txt', 'r')]


def tokenize(text):
	'''
		Tokenize and lemmatize a text using tree tagger

		Arguments
			- text: string containing the the text
		
		Returns
			- tokens: list of all the lemmatized tokens

		NOTE : tree tagger tag function returns
		a tuple (token, tag, lemmatized_token)
	'''
	tree = TreeTagger()

	text = text.lower()

	tokens = [t[2] for t in tree.tag(text) if len(t) == 3 and t[2] != '<unknown>' and t[1] != 'NUM' and t[1] != 'PUN']
	tokens = [t for t in tokens if len(t) > 2]
	tokens = [t for t in tokens if t not in STOPWORDS]

	return tokens


def get_all_doc(filename):
	'''
		Reads csv file, creates an object TextFields to stock 
		text fields.

		Parameters
			- filename: name of the csv file

		Return
			- documents: a list of TextFields
	'''
	print('[...] Reading csv file')
	documents = []
	
	with open(filename, 'r') as f:
		reader = csv.reader(f)
		next(reader)
		t = time.time()
		'''
		for row in reader:
			t = TextFields()
			t.update(row)
			#t.display()
			documents.append(t)
		'''
		documents = [TextFields().update(row) for row in reader]
		t = time.time() - t
		print('[ + ] Done reading ({} seconds spent)'.format(t))

	return documents

	
def test():
	filename = '/home/akira/Documents/Dev/Datasprint/textfields.csv'
	get_all_doc(filename)



'''
def read_txt(textfile):
	with open(textfile, 'r') as f:
	    text = f.read()
	    text = text.replace('\n', ' ')
	    text = text.replace('- ', '')
	    text = text.replace('.', '')
	    text = text.replace('-', '')
	    text = text.replace("‘l'", 'ï')
	return text


def get_fields_index(filename):
			Reads a csv and returns a dict mapping fields name to index

		Parameters
			filename: name of the csv file

		Return
			field_idx_map: dict that maps a field name to its idx
	
	with open(filename, 'r') as f:
	    reader = csv.reader(f)
	    field_idx_map = next(reader)

	field_idx_map = {field: field_idx_map.index(field) for field in field_idx_map}
	
	return field_idx_map
'''