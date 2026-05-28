<?php
namespace App\Command;

use App\Entity\Master\Tenant;
use App\Entity\Tenant\User;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(name: 'app:tenant:create', description: 'Vytvoří nového tenanta s DB a prvním adminem')]
class CreateTenantCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $masterEm,
        private EntityManagerInterface $tenantEm,
        private UserPasswordHasherInterface $passwordHasher,
        private string $projectDir,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Vytvoření nového tenanta');

        // 1. Základní info
        $name   = $io->ask('Název firmy');
        $slug   = $io->ask('Slug (bez mezer)', strtolower(str_replace(' ', '-', $name)));
        $domain = $io->ask('Doména (např. localhost nebo firma.cz)');
        $dbName = $io->ask('Název DB souboru', 'tenant_' . $slug);

        // 2. Ulož tenanta do master DB
        $existing = $this->masterEm->getRepository(Tenant::class)
            ->findOneBy(['domain' => $domain]);

        if ($existing) {
            $io->warning("Tenant s doménou '$domain' již existuje.");
            return Command::FAILURE;
        }

        $tenant = new Tenant();
        $tenant->setName($name);
        $tenant->setSlug($slug);
        $tenant->setDomain($domain);
        $tenant->setDbName($dbName);

        $this->masterEm->persist($tenant);
        $this->masterEm->flush();

        $io->success("Tenant '$name' uložen do master DB.");

        // 3. Přepni tenant connection na novou DB
        $dbPath     = $this->projectDir . '/var/' . $dbName . '.db';
        $connection = $this->tenantEm->getConnection();
        $params     = $connection->getParams();
        $params['path'] = $dbPath;

        $connection->close();
        $connection->__construct(
            $params,
            $connection->getDriver(),
            $connection->getConfiguration(),
        );

        // 4. Vytvoř schéma
        $schemaTool = new SchemaTool($this->tenantEm);
        $classes    = $this->tenantEm->getMetadataFactory()->getAllMetadata();

        try {
            $schemaTool->createSchema($classes);
            $io->success("Databáze '$dbName.db' vytvořena se schématem.");
        } catch (\Exception $e) {
            $io->warning('Schéma již existuje nebo chyba: ' . $e->getMessage());
        }

        // 5. Vytvoř prvního admina
        if ($io->confirm('Chceš vytvořit prvního admina pro tohoto tenanta?', true)) {
            $email    = $io->ask('Admin email');
            $password = $io->askHidden('Admin heslo');
            $adminName = $io->ask('Jméno admina', 'Administrátor');

            $admin = new User();
            $admin->setEmail($email);
            $admin->setName($adminName);
            $admin->setRoles(['ROLE_ADMIN']);
            $admin->setPassword(
                $this->passwordHasher->hashPassword($admin, $password)
            );

            $this->tenantEm->persist($admin);
            $this->tenantEm->flush();

            $io->success("Admin '$email' vytvořen.");
        }

        $io->section('Shrnutí');
        $io->table(
            ['Položka', 'Hodnota'],
            [
                ['Doména',   $domain],
                ['DB soubor', $dbPath],
                ['Přihlášení', "http://$domain/login"],
            ]
        );

        return Command::SUCCESS;
    }
}
