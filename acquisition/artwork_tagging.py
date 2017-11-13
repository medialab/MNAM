import csvkit
from collections import defaultdict
from pprint import pprint
import sys
import csv

csv.field_size_limit(sys.maxsize)


# What do I have ? 
# ---> a label_tag map that you get from gephi csv
# ---> some data that needs to tagged

# What do I need ?
# ---> A function that creates a label-tag map
# ---> Tag all the artworks 


def create_keyword_tag_map(filename):
	'''
		Creates a map that link a keyword to a tag by 
		reading the csv generated from gephi

		Parameter
			filename: filename of the gephi csv

		Return
			keyword_tag_map: a dict {keyword: label}
	'''
	with open(filename, 'r') as f:
		reader = csvkit.DictReader(f)
		next(reader)
		tags = set()
		# Create the map from gephi csv
		keyword_tag_map = defaultdict(lambda: 'unknown')
		for row in reader:
			keyword = row['Label']
			tag = row['theme_check']
			tags.update(tag)
			if tag == 'sciences at savoirs':
				tag = 'sciences et savoirs'
			if tag == 'architectere':
				tag = 'architecture'
			keyword_tag_map[keyword] = tag

	for k, v in keyword_tag_map.items():
		if v == 'OK' or v == 'KO':
			keyword_tag_map[k] = 'unknown'

	print('Number of keywords:', len(keyword_tag_map))
	print('Number of tags:', len(tags))

	return keyword_tag_map


def get_tags_from(gephi_csv):
	'''
		Returns the tags from gephi.csv
	'''
	tags = set()
	with open(gephi_csv, 'r') as f:
		reader = csvkit.DictReader(f)

		for row in reader:
			tags.update(row['tag'])

	return list(tags)

# What do i want to do ?
# ---> tag every artwork based on their keywords

# How would you do it bro' ?
# ---> Retrieve a map that links a keyword to a tag
# ---> go through all the artworks, change their keywords to the corresponding tag

# Warning: are you dealing with multiple tags ?


def get_artist_names(authors, collection):
	'''
	'''
	id_names_map = defaultdict(lambda: '')
	with open(authors, 'r') as f:
		reader = csvkit.DictReader(f)
		for row in reader:
			id_names_map[row['Id artist']] = row['name']
	return id_names_map


def get_tags_from_field(keywords, keyword_tag_map):
	'''
		For a single field ie icono_keywords
		returns corresponding tags
		NOTE: an artwork can have multiple keywords
	'''
	# If there's no keyword describing the artwork
	if len(keywords) == 0:
		tags = ['unknown']
	else:
		tags = [keyword_tag_map[k] for k in keywords if keyword_tag_map[k] is not None]
	tags = list(set(tags))
	
	if len(tags) > 1:
		try:
			tags.remove('unknown')
		except:
			pass
	return tags


def tag_artworks(collection, output, keyword_tag_map):
	'''
		tag all of the artworks of a collection using 
		gephi csv
		Also add name of the author
	'''
	with open(collection, 'r') as fi:
		with open(output, 'w') as fo:
			
			# Init csv reader
			reader = csvkit.DictReader(fi)
			header = reader.fieldnames
			
			# Init new csv with updated header
			#header += ['tag_ico', 'tag_theme', 'tag_mat']
			header.append('tag_thema')
			header.append('name')
			writer = csvkit.DictWriter(fo, fieldnames=header)
			writer.writeheader()

			id_names_map = get_artist_names('/home/akira/Documents/Dev/Datasprint/authors.csv', collection)

			for input_row in reader:
				# Init dict to write
				output_row = dict.fromkeys(header)
				output_row.update(input_row)

				# Tag
				thema_words = input_row['themas'].split(', ')
				tags = get_tags_from_field(thema_words, keyword_tag_map)
				output_row['tag_thema'] = ', '.join(tags)

				# Add author's name
				output_row['name'] = id_names_map[input_row['Id artists']].replace('"', '')

				# Write row
				writer.writerow(output_row)


def keyword_list(collection):
	'''
		Returns the list of theme keywords used in a collecion
	'''
	keywords = set()
	with open(collection, 'r') as f:
		reader = csvkit.DictReader(f)

		for row in reader:
			keywords.update(row['themas'].split(', '))

	return list(keywords)



if __name__ == '__main__':
	gephi_csv = '/home/akira/Documents/Dev/Datasprint/catnode.csv'
	complete_collection = '/home/akira/Documents/Dev/Datasprint/unique_artworks.csv'

	output_tag = 'tagged.csv'

	# Prepare keyword_tag_map
	keyword_tag_map = create_keyword_tag_map(gephi_csv)
	keywords = keyword_list(complete_collection)
	for k in keywords:
		if k not in keyword_tag_map:
			keyword_tag_map[k] = 'unknown'
	
	# Tag all artworks
	tag_artworks(complete_collection, output_tag, keyword_tag_map)