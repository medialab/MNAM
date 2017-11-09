class TextFields(object):
	def __init__(self):
		self._id = ''
		self._theme = ''
		self._ico = ''
		self._mov = ''
		self._mat = ''


	def update(self, fields):
		
		from utils import tokenize
		
		assert (len(fields) == 5), 'Cant update fields. Wrong array len.'
		self._id = fields[0]
		self._theme = tokenize(fields[2])
		self._ico = tokenize(fields[3])
		self._mov = tokenize(fields[1])
		self._mat = tokenize(fields[4])


	def display(self):
		'''
			Display TextFields attributes
		'''
		print('id: \t\t',self._id) 
		print('thematique:\t', self._theme)
		print('iconographique:\t', self._ico)
		print('mouvements:\t', self._mov)
		print('materiaux:\t', self._mat)


def join_tokens(self):
	'''
		Each attribute is a list of tokens. In order to use scikit-learn
		function, we need to join those tokens.
	'''
	self.theme = ' '.join(self._theme)
	self.ico = ' '.join(self._ico)
	self.mov = ' '.join(self._mov)
	self.mat = ' '.join(self._mat)



	@property
	def theme(self):
		return self._theme

	@theme.setter
	def theme(self, theme):
		self._theme = theme

	@property
	def ico(self):
		return self._ico

	@ico.setter
	def ico(self, ico):
		self._ico = ico

	@property
	def mov(self):
		return self._mov

	@mov.setter
	def mov(self, mov):
		self._mov = mov

	@property
	def mat(self):
		return self._mat

	@mat.setter
	def mat(self, mat):
		self._mat = mat

	@property
	def id(self):
		return self._id

	@id.setter
	def id(self, id):
		self._id = id
