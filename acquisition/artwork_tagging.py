import csvkit

from utils import create_keyword_tag_map


# What do i want to do ?
# ---> tag every artwork based on their keywords

# How would you do it bro' ?
# ---> Retrieve a map that links a keyword to a tag
# ---> go through all the artworks, change their keywords to the corresponding tag

# Warning: are you dealing with multiple tags ?



def get_tag_from_field(keywords, keywords_tag_map):
	'''
		For a single field ie icono_keywords
		returns corresponding tags
		NOTE: an artwork can have multiple keywords
	'''
	tags = [keywords_tag_map[k] for k in keywords]
	return list(set(tagged_field))


def tag_artworks(collection, output, keywords_tag_map):
	'''
		tag all of the artworks of a collection using 
		gephi csv
	'''
	with open(collection, 'r') as fi:
		with open(output, 'w') as fo:
			
			# Init csv reader
			reader = csvkit.DictReader(fi)
			header = reader.fieldnames
			
			# Init new csv with updated header
			#header += ['tag_ico', 'tag_theme', 'tag_mat']
			header += 'tag_theme'
			writer = csvkit.DictWriter(fo, header=header)
			writer.writeheader()

			for input_row in reader:
				# Init dict to write
				output_row = dict.fromkeys(header)
				output_row.update(input)

				# Tag
				ico_words = input_row['key_words_the']
				tags = get_tag_from_field(ico_words, keywords_tag_map)
				output_row['tag_ico']

				# Write row
				writer.writerow(output_row)


def compute_art_by_tag(collection, output, tags):
	'''
		Computes the quantity of atrworks that have 
	'''
	with open(collection, 'r') as fi:
		with open(output, 'w') as fo:
			
			# Init csv reader
			reader = csvkit.DictReader(fi)
			header = reader.fieldnames
			
			# Init new csv with updated header
			#header += ['tag_ico', 'tag_theme', 'tag_mat']
			header += 'quantity_theme'
			writer = csvkit.DictWriter(fo, header=header)
			writer.writeheader()

			# Get number of artworks in the currenct collection
			total = len(reader)


if __name__ == '__main__':
	gephi_csv = 'jksdfjsd.csv'
	complete_collection = 'complete_collection.csv'

	output_tag = 'output_1.csv'
	output_weight = 'output_2.csv'

	keywords_tag_map = create_keyword_tag_map(gephi_csv)
	tags = get_tag_from_field(gephi_csv)



			




