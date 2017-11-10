import csvkit


def get_attribute_values_from(collection, attribute_name):
	'''
		Returns a set of all possible values for a given attribute
	'''
	with open(collection, 'r') as f:
		reader = csvkit.DictReader(f):

		values = set()

		for row in reader:
			values.update(row[attribute_name])

		return values


def create_by_creationdate(collection):
	with open(collection, 'r') as f:
		with open('data_vis_creationdate.csv', 'w'):
			pass


def create_by_acquisitiondate_acquisitionmode(collection):
	with open(collection, 'r') as f:
		with open('data_vis_creationdate.csv', 'w'):
			# Init csv reader
			reader = csvkit.DictReader(fi)
			
			# Init new csv with updated header
			header = ['tag_thema', 'Year acquisition', 'Mode acquisition', 'value']
			writer = csvkit.DictWriter(fo, fieldnames=header)
			writer.writeheader()

	
def create_by_creationdate_artist(collection):
	pass



if __name__ == '__main__':

	collection = 'collection.csv'

	years_acquisition = get_attribute_values_from(collection, 'Year acquisition')
	years_creation = get_attribute_values_from(collection, 'Year creation')
	modes_acquisition = get_attribute_values_from(collection)

