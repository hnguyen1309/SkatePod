-- Jump combinations are saved as one element with their jumps joined by "+", like the app does
-- ("2A+1Eu+3S", "3Lz+3Lo+3Lo"). The longest is 11 characters, so 10 was too short. 20 leaves room.
ALTER TABLE program_elements ALTER COLUMN code TYPE VARCHAR(20);
ALTER TABLE program_placements ALTER COLUMN code TYPE VARCHAR(20);
